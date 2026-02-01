import type { CreateShapeDTO, Shape } from '@/entities/shape';
import { diagramApi } from '@/entities/diagram';
import { commandManager } from '@/features/canvas-commands/model/CommandManager';
import {
  canShapeBeReferenceSource,
  canShapeBeFolderReferenceSource,
} from '@/entities/reference';
import { handleStoreError } from '../utils/errorHandler';
import { syncShapeToCanvas, syncShapesToCanvas } from '../utils/canvasSync';
import type { DiagramSlice, ShapeSlice } from '../types';

/**
 * Shape operations slice - public and internal methods for shape CRUD.
 *
 * Public methods create commands and execute via commandManager.
 * Internal methods are the command executors (called by commands for undo/redo).
 */
export const createShapeSlice: DiagramSlice<ShapeSlice> = (set, get) => ({
  // ============================================================================
  // Public methods (wrapped in commands)
  // ============================================================================

  addShape: async (diagramId: string, shape: CreateShapeDTO) => {
    try {
      // Create and execute command (which calls _internalAddShape, handling references)
      const command = get().commandFactory.createAddShape(diagramId, shape);
      await commandManager.execute(command, diagramId);

      // Get the diagram to find the newly created shape ID
      const diagram = get().diagrams[diagramId];
      if (!diagram || !diagram.shapes || diagram.shapes.length === 0) {
        throw new Error('Failed to retrieve created shape');
      }

      // Return the ID of the last added shape
      return diagram.shapes[diagram.shapes.length - 1].id;
    } catch (error) {
      handleStoreError(error, set, diagramId, 'Failed to add shape');
    }
  },

  updateShape: async (diagramId: string, shapeId: string, updates: Partial<Shape>) => {
    try {
      // Get the current shape to capture before state
      const currentShape = await get()._internalGetShape(diagramId, shapeId);
      if (!currentShape) {
        throw new Error(`Shape ${shapeId} not found`);
      }

      // Only position updates are currently supported
      const isPositionOnly =
        Object.keys(updates).length === 2 && 'x' in updates && 'y' in updates;

      if (!isPositionOnly) {
        throw new Error('Only position updates (x, y) are currently supported');
      }

      const command = get().commandFactory.createMoveShape(
        diagramId,
        shapeId,
        { x: currentShape.x, y: currentShape.y },
        { x: updates.x!, y: updates.y! }
      );
      await commandManager.execute(command, diagramId);
    } catch (error) {
      handleStoreError(error, set, diagramId, 'Failed to update shape');
    }
  },

  updateShapes: async (
    diagramId: string,
    updates: Array<{ shapeId: string; updates: Partial<Shape> }>
  ) => {
    try {
      // Build array of moves with before/after positions
      const moves = await Promise.all(
        updates.map(async ({ shapeId, updates: shapeUpdates }) => {
          const currentShape = await get()._internalGetShape(diagramId, shapeId);
          if (!currentShape) {
            throw new Error(`Shape ${shapeId} not found`);
          }

          // Only position updates are currently supported
          const isPositionOnly =
            Object.keys(shapeUpdates).length === 2 &&
            'x' in shapeUpdates &&
            'y' in shapeUpdates;

          if (!isPositionOnly) {
            throw new Error('Only position updates (x, y) are currently supported');
          }

          return {
            shapeId,
            fromPosition: { x: currentShape.x, y: currentShape.y },
            toPosition: { x: shapeUpdates.x!, y: shapeUpdates.y! },
          };
        })
      );

      // Create ONE MoveEntitiesCommand with batched update function
      const command = get().commandFactory.createMoveEntities(diagramId, moves);

      // Execute the single command (one API call, one state update)
      await commandManager.execute(command, diagramId);
    } catch (error) {
      handleStoreError(error, set, diagramId, 'Failed to update shapes');
    }
  },

  updateShapeLabel: async (diagramId: string, shapeId: string, newLabel: string) => {
    try {
      // Get current shape to capture old label
      const currentShape = await get()._internalGetShape(diagramId, shapeId);
      if (!currentShape) {
        throw new Error(`Shape ${shapeId} not found`);
      }

      // Create and execute command
      const command = get().commandFactory.createUpdateShapeLabel(
        diagramId,
        shapeId,
        currentShape.label,
        newLabel
      );
      await commandManager.execute(command, diagramId);

      // Update associated reference name if this shape has a reference
      const { useReferenceStore } = await import('@/entities/reference/store/useReferenceStore');
      const referenceStore = useReferenceStore.getState();
      const reference = referenceStore.getReferenceBySourceShapeId(shapeId);

      if (reference) {
        await referenceStore.updateReferenceName(reference.id, newLabel);
      }
    } catch (error) {
      handleStoreError(error, set, diagramId, 'Failed to update shape label');
    }
  },

  deleteShape: async (diagramId: string, shapeId: string) => {
    try {
      // Delete any associated reference before deleting the shape
      const { useReferenceStore } = await import('@/entities/reference/store/useReferenceStore');
      const referenceStore = useReferenceStore.getState();
      await referenceStore.deleteReferenceBySourceShapeId(shapeId);

      // Create and execute command with batch connector deletion support
      const command = get().commandFactory.createDeleteShape(diagramId, shapeId);
      await commandManager.execute(command, diagramId);
    } catch (error) {
      handleStoreError(error, set, diagramId, 'Failed to delete shape');
    }
  },

  deleteShapes: async (diagramId: string, shapeIds: string[]) => {
    try {
      // Delete any associated references before deleting the shapes
      const { useReferenceStore } = await import('@/entities/reference/store/useReferenceStore');
      const referenceStore = useReferenceStore.getState();
      for (const shapeId of shapeIds) {
        await referenceStore.deleteReferenceBySourceShapeId(shapeId);
      }

      // Create and execute batch delete command (single undo operation)
      const command = get().commandFactory.createBatchDeleteShapes(diagramId, shapeIds);
      await commandManager.execute(command, diagramId);
    } catch (error) {
      handleStoreError(error, set, diagramId, 'Failed to delete shapes');
    }
  },

  // ============================================================================
  // Internal methods (used by commands, not wrapped)
  // ============================================================================

  _internalAddShape: async (
    diagramId: string,
    shape: CreateShapeDTO,
    options?: { skipReferenceCreation?: boolean }
  ) => {
    const updatedDiagram = await diagramApi.addShape(diagramId, shape);

    if (!updatedDiagram) {
      throw new Error(`Diagram ${diagramId} not found`);
    }

    set((state) => ({
      diagrams: { ...state.diagrams, [diagramId]: updatedDiagram },
    }));

    // Update canvas instance local state to ensure immediate rendering
    const newShape = updatedDiagram.shapes[updatedDiagram.shapes.length - 1];
    if (newShape) {
      syncShapeToCanvas(diagramId, 'add', newShape);
    }

    // Create reference if eligible (skip for preview shapes or explicit opt-out)
    if (!options?.skipReferenceCreation && !shape.isPreview && newShape) {
      if (canShapeBeReferenceSource(shape.type, shape.subtype)) {
        const { useReferenceStore } = await import('@/entities/reference/store/useReferenceStore');
        const referenceStore = useReferenceStore.getState();
        const isFolderReference = canShapeBeFolderReferenceSource(shape.type, shape.subtype);

        await referenceStore.createReference({
          designWorkId: updatedDiagram.designWorkId,
          name: shape.label || shape.type,
          contentType: 'diagram',
          contentId: diagramId,
          sourceShapeId: newShape.id,
          referenceType: 'link',
          metadata: {
            sourceShapeType: shape.type,
            sourceShapeSubtype: shape.subtype,
            diagramType: updatedDiagram.type,
            dropTarget: isFolderReference ? 'folder' : 'canvas',
          },
        });
      }
    }

    return updatedDiagram;
  },

  _internalAddShapesBatch: async (
    diagramId: string,
    shapes: CreateShapeDTO[],
    options?: { skipReferenceCreation?: boolean }
  ) => {
    // Add all shapes sequentially to the API but only trigger one set() at the end
    let currentDiagram = get().diagrams[diagramId];
    if (!currentDiagram) {
      throw new Error(`Diagram ${diagramId} not found`);
    }

    for (const shape of shapes) {
      const updatedDiagram = await diagramApi.addShape(diagramId, shape);
      if (!updatedDiagram) {
        throw new Error(`Failed to add shape to diagram ${diagramId}`);
      }
      currentDiagram = updatedDiagram;
    }

    // Single set() call at the end
    set((state) => ({
      diagrams: { ...state.diagrams, [diagramId]: currentDiagram },
    }));

    // Update canvas instance with all new shapes
    const startIndex = currentDiagram.shapes.length - shapes.length;
    const newShapes = currentDiagram.shapes.slice(startIndex);
    syncShapesToCanvas(diagramId, 'add', newShapes);

    // Create references for eligible shapes (skip preview or explicit opt-out)
    if (!options?.skipReferenceCreation) {
      const { useReferenceStore } = await import('@/entities/reference/store/useReferenceStore');
      const referenceStore = useReferenceStore.getState();

      for (let i = 0; i < shapes.length; i++) {
        const shapeDTO = shapes[i];
        const newShape = currentDiagram.shapes[startIndex + i];

        // Skip preview shapes and non-reference-source shapes
        if (shapeDTO.isPreview) continue;
        if (!canShapeBeReferenceSource(shapeDTO.type, shapeDTO.subtype)) continue;

        const isFolderReference = canShapeBeFolderReferenceSource(shapeDTO.type, shapeDTO.subtype);

        await referenceStore.createReference({
          designWorkId: currentDiagram.designWorkId,
          name: shapeDTO.label || shapeDTO.type,
          contentType: 'diagram',
          contentId: diagramId,
          sourceShapeId: newShape.id,
          referenceType: 'link',
          metadata: {
            sourceShapeType: shapeDTO.type,
            sourceShapeSubtype: shapeDTO.subtype,
            diagramType: currentDiagram.type,
            dropTarget: isFolderReference ? 'folder' : 'canvas',
          },
        });
      }
    }

    return currentDiagram;
  },

  _internalUpdateShape: async (
    diagramId: string,
    shapeId: string,
    updates: Partial<Shape>
  ) => {
    const updatedDiagram = await diagramApi.updateShape(diagramId, shapeId, updates);

    if (updatedDiagram) {
      set((state) => ({
        diagrams: { ...state.diagrams, [diagramId]: updatedDiagram },
      }));
    }

    return updatedDiagram;
  },

  _internalUpdateShapes: async (
    diagramId: string,
    updates: Array<{ shapeId: string; updates: Partial<Shape> }>
  ) => {
    const updatedDiagram = await diagramApi.updateShapes(diagramId, updates);

    if (updatedDiagram) {
      set((state) => ({
        diagrams: { ...state.diagrams, [diagramId]: updatedDiagram },
      }));
    }

    return updatedDiagram;
  },

  _internalDeleteShape: async (diagramId: string, shapeId: string) => {
    const updatedDiagram = await diagramApi.deleteShape(diagramId, shapeId);

    if (updatedDiagram) {
      set((state) => ({
        diagrams: { ...state.diagrams, [diagramId]: updatedDiagram },
      }));

      // Update canvas instance local state
      syncShapeToCanvas(diagramId, 'remove', shapeId);
    }

    return updatedDiagram;
  },

  _internalRestoreShape: async (diagramId: string, shape: Shape) => {
    const updatedDiagram = await diagramApi.restoreShape(diagramId, shape);

    if (!updatedDiagram) {
      throw new Error(`Diagram ${diagramId} not found`);
    }

    set((state) => ({
      diagrams: { ...state.diagrams, [diagramId]: updatedDiagram },
    }));

    // Update canvas instance local state
    syncShapeToCanvas(diagramId, 'add', shape);

    return updatedDiagram;
  },

  _internalGetShape: async (diagramId: string, shapeId: string) => {
    const diagram = get().diagrams[diagramId];
    if (!diagram) {
      return null;
    }

    const shape = diagram.shapes.find((s: Shape) => s.id === shapeId);
    return shape ?? null;
  },

  _internalDeleteShapesBatch: async (diagramId: string, shapeIds: string[]) => {
    if (shapeIds.length === 0) {
      return get().diagrams[diagramId] ?? null;
    }

    const updatedDiagram = await diagramApi.deleteShapesByIds(diagramId, shapeIds);

    if (updatedDiagram) {
      set((state) => ({
        diagrams: { ...state.diagrams, [diagramId]: updatedDiagram },
      }));

      // Update canvas instance local state - remove all shapes at once
      syncShapesToCanvas(diagramId, 'remove', shapeIds);
    }

    return updatedDiagram;
  },

  _internalRestoreShapesBatch: async (diagramId: string, shapes: Shape[]) => {
    if (shapes.length === 0) {
      return get().diagrams[diagramId] ?? null;
    }

    const updatedDiagram = await diagramApi.restoreShapes(diagramId, shapes);

    if (!updatedDiagram) {
      throw new Error(`Diagram ${diagramId} not found`);
    }

    set((state) => ({
      diagrams: { ...state.diagrams, [diagramId]: updatedDiagram },
    }));

    // Update canvas instance local state - add all shapes at once
    syncShapesToCanvas(diagramId, 'add', shapes);

    return updatedDiagram;
  },
});

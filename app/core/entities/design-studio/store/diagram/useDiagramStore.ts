import { create } from 'zustand';
import type { Diagram, CreateDiagramDto, CreateShapeDTO, Shape } from '../../types';
import type { CreateConnectorDTO, Connector } from '../../types/Connector';
import { diagramApi } from '../../api';
import { commandManager } from '~/core/commands/CommandManager';
import { CommandFactory } from '~/core/commands/CommandFactory';
import { canvasInstanceRegistry } from '~/design-studio/store/content/canvasInstanceRegistry';
import {
  canShapeBeReferenceSource,
  canShapeBeFolderReferenceSource,
} from '~/design-studio/config/reference-types';

interface DiagramStore {
  // Command factory for centralized command creation
  commandFactory: CommandFactory;

  // State
  diagrams: Record<string, Diagram>; // Indexed by diagram ID (includes shapes, connectors, viewport)
  errors: Record<string, Error | null>; // Per-diagram error state

  // Diagram hydration - called by TanStack Query to sync fetched data
  setDiagram: (diagram: Diagram) => void;
  // Clear diagram from store (called on unmount to ensure fresh data on reopen)
  clearDiagram: (id: string) => void;

  // Diagram CRUD actions
  createDiagram: (data: CreateDiagramDto) => Promise<Diagram>;
  updateDiagram: (id: string, updates: Partial<Diagram>) => Promise<void>;
  deleteDiagram: (id: string) => Promise<void>;

  // Shape manipulation actions (public - wrapped in commands)
  addShape: (diagramId: string, shape: CreateShapeDTO) => Promise<string>;
  updateShape: (diagramId: string, shapeId: string, updates: Partial<Shape>) => Promise<void>;
  updateShapes: (
    diagramId: string,
    updates: Array<{ shapeId: string; updates: Partial<Shape> }>
  ) => Promise<void>;
  updateShapeLabel: (diagramId: string, shapeId: string, newLabel: string) => Promise<void>;
  deleteShape: (diagramId: string, shapeId: string) => Promise<void>;
  deleteShapes: (diagramId: string, shapeIds: string[]) => Promise<void>;

  // Internal shape actions (used by commands, not wrapped)
  _internalAddShape: (
    diagramId: string,
    shape: CreateShapeDTO,
    options?: { skipReferenceCreation?: boolean }
  ) => Promise<Diagram>;
  _internalAddShapesBatch: (
    diagramId: string,
    shapes: CreateShapeDTO[],
    options?: { skipReferenceCreation?: boolean }
  ) => Promise<Diagram>;
  _internalUpdateShape: (
    diagramId: string,
    shapeId: string,
    updates: Partial<Shape>
  ) => Promise<Diagram | null>;
  _internalUpdateShapes: (
    diagramId: string,
    updates: Array<{ shapeId: string; updates: Partial<Shape> }>
  ) => Promise<Diagram | null>;
  _internalDeleteShape: (diagramId: string, shapeId: string) => Promise<Diagram | null>;
  _internalRestoreShape: (diagramId: string, shape: Shape) => Promise<Diagram>;
  _internalGetShape: (diagramId: string, shapeId: string) => Promise<Shape | null>;
  _internalDeleteShapesBatch: (diagramId: string, shapeIds: string[]) => Promise<Diagram | null>;
  _internalRestoreShapesBatch: (diagramId: string, shapes: Shape[]) => Promise<Diagram | null>;

  // Connector manipulation actions (public - wrapped in commands)
  addConnector: (diagramId: string, connector: CreateConnectorDTO) => Promise<void>;
  updateConnectorLabel: (
    diagramId: string,
    connectorId: string,
    newLabel: string
  ) => Promise<void>;
  deleteConnector: (diagramId: string, connectorId: string) => Promise<void>;
  deleteConnectors: (diagramId: string, connectorIds: string[]) => Promise<void>;

  // Internal connector actions (used by commands, not wrapped)
  _internalAddConnector: (
    diagramId: string,
    connector: CreateConnectorDTO
  ) => Promise<Diagram | null>;
  _internalAddConnectorsBatch: (
    diagramId: string,
    connectors: CreateConnectorDTO[]
  ) => Promise<Diagram | null>;
  _internalUpdateConnector: (
    diagramId: string,
    connectorId: string,
    updates: Partial<Connector>
  ) => Promise<Diagram | null>;
  _internalDeleteConnector: (diagramId: string, connectorId: string) => Promise<Diagram | null>;
  _internalRestoreConnector: (diagramId: string, connector: Connector) => Promise<Diagram | null>;
  _internalGetConnector: (diagramId: string, connectorId: string) => Promise<Connector | null>;
  _internalDeleteConnectorsBatch: (
    diagramId: string,
    connectorIds: string[]
  ) => Promise<Diagram | null>;
  _internalRestoreConnectorsBatch: (
    diagramId: string,
    connectors: Connector[]
  ) => Promise<Diagram | null>;

  // Internal diagram actions
  _internalUpdateDiagramMermaid: (diagramId: string, mermaidSyntax: string) => void;
}

export const useDiagramStore = create<DiagramStore>((set, get) => {
  // Initialize CommandFactory with store dependencies
  const commandFactory = new CommandFactory({
    _internalAddShape: (diagramId, shape) => get()._internalAddShape(diagramId, shape),
    _internalDeleteShape: (diagramId, shapeId) => get()._internalDeleteShape(diagramId, shapeId),
    _internalUpdateShape: (diagramId, shapeId, updates) =>
      get()._internalUpdateShape(diagramId, shapeId, updates),
    _internalUpdateShapes: (diagramId, updates) =>
      get()._internalUpdateShapes(diagramId, updates),
    _internalRestoreShape: (diagramId, shape) => get()._internalRestoreShape(diagramId, shape),
    _internalGetShape: (diagramId, shapeId) => get()._internalGetShape(diagramId, shapeId),
    _internalAddConnector: (diagramId, connector) =>
      get()._internalAddConnector(diagramId, connector),
    _internalDeleteConnector: (diagramId, connectorId) =>
      get()._internalDeleteConnector(diagramId, connectorId),
    _internalUpdateConnector: (diagramId, connectorId, updates) =>
      get()._internalUpdateConnector(diagramId, connectorId, updates),
    _internalRestoreConnector: (diagramId, connector) =>
      get()._internalRestoreConnector(diagramId, connector),
    _internalGetConnector: (diagramId, connectorId) =>
      get()._internalGetConnector(diagramId, connectorId),
    _internalDeleteConnectorsBatch: (diagramId, connectorIds) =>
      get()._internalDeleteConnectorsBatch(diagramId, connectorIds),
    _internalRestoreConnectorsBatch: (diagramId, connectors) =>
      get()._internalRestoreConnectorsBatch(diagramId, connectors),
    _internalDeleteShapesBatch: (diagramId, shapeIds) =>
      get()._internalDeleteShapesBatch(diagramId, shapeIds),
    _internalRestoreShapesBatch: (diagramId, shapes) =>
      get()._internalRestoreShapesBatch(diagramId, shapes),
    getDiagram: (diagramId) => get().diagrams[diagramId] ?? null,
    getUpdateLocalShape: (diagramId) => {
      const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
      return canvasInstance.getState().updateLocalShape;
    },
    getUpdateLocalConnector: (diagramId) => {
      const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
      return canvasInstance.getState().updateLocalConnector;
    },
    getCurrentConnector: (diagramId, connectorId) => {
      const diagram = get().diagrams[diagramId];
      if (!diagram) return null;
      return diagram.connectors.find((c) => c.id === connectorId) ?? null;
    },
  });

  return {
    // Command factory instance
    commandFactory,

    // Initial state
    diagrams: {},
    errors: {},

    // Diagram hydration - called by TanStack Query to sync fetched data
    setDiagram: (diagram: Diagram) => {
      set((state) => ({
        diagrams: { ...state.diagrams, [diagram.id]: diagram },
      }));
    },

    // Clear diagram from store (called on unmount to ensure fresh data on reopen)
    clearDiagram: (id: string) => {
      set((state) => {
        const newDiagrams = { ...state.diagrams };
        const newErrors = { ...state.errors };
        delete newDiagrams[id];
        delete newErrors[id];
        return { diagrams: newDiagrams, errors: newErrors };
      });
    },

    createDiagram: async (data: CreateDiagramDto) => {
      try {
        const diagram = await diagramApi.create(data);

        // Import and call DesignWork store to add reference
        const { useDesignWorkStore } = await import('../design-work/useDesignWorkStore');
        const designWorkStore = useDesignWorkStore.getState();

        const parentDesignWork = designWorkStore.designWorks.find(
          (dw) => dw.id === data.designWorkId
        );
        if (!parentDesignWork) {
          throw new Error(`DesignWork ${data.designWorkId} not found`);
        }

        // Calculate next order across all content types
        const allOrders = [
          ...parentDesignWork.diagrams.map((d) => d.order),
          ...parentDesignWork.interfaces.map((i) => i.order),
          ...parentDesignWork.documents.map((d) => d.order),
        ];
        const nextOrder = allOrders.length > 0 ? Math.max(...allOrders) + 1 : 0;

        // Create diagram reference
        const diagramRef = {
          id: diagram.id,
          name: diagram.name,
          type: diagram.type,
          order: nextOrder,
        };

        // Add reference to parent DesignWork
        await designWorkStore.addContentReference(data.designWorkId, 'diagram', diagramRef);

        // Update local state
        set((state) => ({
          diagrams: { ...state.diagrams, [diagram.id]: diagram },
        }));

        return diagram;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to create diagram');
        set((state) => ({
          errors: { ...state.errors, creating: err },
        }));
        throw error;
      }
    },

    updateDiagram: async (id: string, updates: Partial<Diagram>) => {
      try {
        const updated = await diagramApi.update(id, updates);
        if (updated) {
          set((state) => ({
            diagrams: { ...state.diagrams, [id]: updated },
          }));
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to update diagram');
        set((state) => ({
          errors: { ...state.errors, [id]: err },
        }));
        throw error;
      }
    },

    deleteDiagram: async (id: string) => {
      try {
        await diagramApi.delete(id);

        // Clear command history for this diagram
        commandManager.clearScope(id);

        // Import and call DesignWork store to remove reference
        const { useDesignWorkStore } = await import('../design-work/useDesignWorkStore');
        const designWorkStore = useDesignWorkStore.getState();

        // Find parent DesignWork
        const parentDesignWork = designWorkStore.designWorks.find((dw) =>
          dw.diagrams.some((d) => d.id === id)
        );

        if (parentDesignWork) {
          await designWorkStore.removeContentReference(parentDesignWork.id, 'diagram', id);
        }

        // Update local state
        set((state) => {
          const newDiagrams = { ...state.diagrams };
          const newErrors = { ...state.errors };

          delete newDiagrams[id];
          delete newErrors[id];

          return {
            diagrams: newDiagrams,
            errors: newErrors,
          };
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to delete diagram');
        set((state) => ({
          errors: { ...state.errors, [id]: err },
        }));
        throw error;
      }
    },

    // Shape actions - public (wrapped in commands)
    // Reference creation is now handled in _internalAddShape, called by the command
    addShape: async (diagramId: string, shape: CreateShapeDTO) => {
      try {
        // Create and execute command (which calls _internalAddShape, handling references)
        const command = commandFactory.createAddShape(diagramId, shape);
        await commandManager.execute(command, diagramId);

        // Get the diagram to find the newly created shape ID
        const diagram = get().diagrams[diagramId];
        if (!diagram || !diagram.shapes || diagram.shapes.length === 0) {
          throw new Error('Failed to retrieve created shape');
        }

        // Return the ID of the last added shape
        return diagram.shapes[diagram.shapes.length - 1].id;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to add shape');
        set((state) => ({
          errors: { ...state.errors, [diagramId]: err },
        }));
        throw error;
      }
    },

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
      const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
      const newShape = updatedDiagram.shapes[updatedDiagram.shapes.length - 1];
      if (newShape) {
        canvasInstance.getState().addLocalShape(newShape);
      }

      // Create reference if eligible (skip for preview shapes or explicit opt-out)
      if (!options?.skipReferenceCreation && !shape.isPreview && newShape) {
        if (canShapeBeReferenceSource(shape.type, shape.subtype)) {
          const { useReferenceStore } = await import('../reference/useReferenceStore');
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
      const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
      const startIndex = currentDiagram.shapes.length - shapes.length;
      for (let i = 0; i < shapes.length; i++) {
        const newShape = currentDiagram.shapes[startIndex + i];
        canvasInstance.getState().addLocalShape(newShape);
      }

      // Create references for eligible shapes (skip preview or explicit opt-out)
      if (!options?.skipReferenceCreation) {
        const { useReferenceStore } = await import('../reference/useReferenceStore');
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

        const command = commandFactory.createMoveShape(
          diagramId,
          shapeId,
          { x: currentShape.x, y: currentShape.y },
          { x: updates.x!, y: updates.y! }
        );
        await commandManager.execute(command, diagramId);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to update shape');
        set((state) => ({
          errors: { ...state.errors, [diagramId]: err },
        }));
        throw error;
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
        const command = commandFactory.createMoveEntities(diagramId, moves);

        // Execute the single command (one API call, one state update)
        await commandManager.execute(command, diagramId);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to update shapes');
        set((state) => ({
          errors: { ...state.errors, [diagramId]: err },
        }));
        throw error;
      }
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

    updateShapeLabel: async (diagramId: string, shapeId: string, newLabel: string) => {
      try {
        // Get current shape to capture old label
        const currentShape = await get()._internalGetShape(diagramId, shapeId);
        if (!currentShape) {
          throw new Error(`Shape ${shapeId} not found`);
        }

        // Create and execute command
        const command = commandFactory.createUpdateShapeLabel(
          diagramId,
          shapeId,
          currentShape.label,
          newLabel
        );
        await commandManager.execute(command, diagramId);

        // Update associated reference name if this shape has a reference
        const { useReferenceStore } = await import('../reference/useReferenceStore');
        const referenceStore = useReferenceStore.getState();
        const reference = referenceStore.getReferenceBySourceShapeId(shapeId);

        if (reference) {
          await referenceStore.updateReferenceName(reference.id, newLabel);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to update shape label');
        set((state) => ({
          errors: { ...state.errors, [diagramId]: err },
        }));
        throw error;
      }
    },

    deleteShape: async (diagramId: string, shapeId: string) => {
      try {
        // Delete any associated reference before deleting the shape
        const { useReferenceStore } = await import('../reference/useReferenceStore');
        const referenceStore = useReferenceStore.getState();
        await referenceStore.deleteReferenceBySourceShapeId(shapeId);

        // Create and execute command with batch connector deletion support
        const command = commandFactory.createDeleteShape(diagramId, shapeId);
        await commandManager.execute(command, diagramId);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to delete shape');
        set((state) => ({
          errors: { ...state.errors, [diagramId]: err },
        }));
        throw error;
      }
    },

    deleteShapes: async (diagramId: string, shapeIds: string[]) => {
      try {
        // Delete any associated references before deleting the shapes
        const { useReferenceStore } = await import('../reference/useReferenceStore');
        const referenceStore = useReferenceStore.getState();
        for (const shapeId of shapeIds) {
          await referenceStore.deleteReferenceBySourceShapeId(shapeId);
        }

        // Create and execute batch delete command (single undo operation)
        const command = commandFactory.createBatchDeleteShapes(diagramId, shapeIds);
        await commandManager.execute(command, diagramId);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to delete shapes');
        set((state) => ({
          errors: { ...state.errors, [diagramId]: err },
        }));
        throw error;
      }
    },

    _internalDeleteShape: async (diagramId: string, shapeId: string) => {
      const updatedDiagram = await diagramApi.deleteShape(diagramId, shapeId);

      if (updatedDiagram) {
        set((state) => ({
          diagrams: { ...state.diagrams, [diagramId]: updatedDiagram },
        }));

        // Update canvas instance local state
        const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
        canvasInstance.getState().removeLocalShape(shapeId);
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
      const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
      canvasInstance.getState().addLocalShape(shape);

      return updatedDiagram;
    },

    _internalGetShape: async (diagramId: string, shapeId: string) => {
      const diagram = get().diagrams[diagramId];
      if (!diagram) {
        return null;
      }

      const shape = diagram.shapes.find((s) => s.id === shapeId);
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
        const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
        shapeIds.forEach((shapeId) => {
          canvasInstance.getState().removeLocalShape(shapeId);
        });
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
      const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
      shapes.forEach((shape) => {
        canvasInstance.getState().addLocalShape(shape);
      });

      return updatedDiagram;
    },

    // Connector actions - public (wrapped in commands)
    addConnector: async (diagramId: string, connector: CreateConnectorDTO) => {
      try {
        // Create and execute command
        const command = commandFactory.createAddConnector(diagramId, connector);
        await commandManager.execute(command, diagramId);

        // Refresh activation boxes and lifeline heights for sequence diagrams
        const diagram = get().diagrams[diagramId];
        if (diagram?.type === 'sequence' && connector.type.startsWith('sequence-')) {
          // Calculate and update lifeline heights first
          const { calculateRequiredLifelineHeight } = await import(
            '~/design-studio/diagrams/sequence/heightCalculator'
          );
          const requiredHeight = calculateRequiredLifelineHeight(
            diagram.shapes,
            diagram.connectors || []
          );
          const heightCommand = commandFactory.createUpdateLifelineHeights(
            diagramId,
            requiredHeight
          );
          await commandManager.execute(heightCommand, diagramId);

          // Then refresh activation boxes
          const refreshCommand = commandFactory.createRefreshSequenceActivations(diagramId);
          await commandManager.execute(refreshCommand, diagramId);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to add connector');
        set((state) => ({
          errors: { ...state.errors, [diagramId]: err },
        }));
        throw error;
      }
    },

    _internalAddConnector: async (diagramId: string, connector: CreateConnectorDTO) => {
      const updatedDiagram = await diagramApi.addConnector(diagramId, connector);

      if (!updatedDiagram) {
        throw new Error(`Diagram ${diagramId} not found`);
      }

      set((state) => ({
        diagrams: { ...state.diagrams, [diagramId]: updatedDiagram },
      }));

      // Update canvas instance local state
      const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
      if (updatedDiagram.connectors.length > 0) {
        const newConnector = updatedDiagram.connectors[updatedDiagram.connectors.length - 1];
        canvasInstance.getState().addLocalConnector(newConnector);
      }

      return updatedDiagram;
    },

    _internalAddConnectorsBatch: async (diagramId: string, connectors: CreateConnectorDTO[]) => {
      // Add all connectors sequentially to the API but only trigger one set() at the end
      let currentDiagram = get().diagrams[diagramId];
      if (!currentDiagram) {
        throw new Error(`Diagram ${diagramId} not found`);
      }

      for (const connector of connectors) {
        const updatedDiagram = await diagramApi.addConnector(diagramId, connector);
        if (!updatedDiagram) {
          throw new Error(`Failed to add connector to diagram ${diagramId}`);
        }
        currentDiagram = updatedDiagram;
      }

      // Single set() call at the end
      set((state) => ({
        diagrams: { ...state.diagrams, [diagramId]: currentDiagram },
      }));

      // Update canvas instance with all new connectors
      const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
      const startIndex = currentDiagram.connectors.length - connectors.length;
      for (let i = 0; i < connectors.length; i++) {
        const newConnector = currentDiagram.connectors[startIndex + i];
        canvasInstance.getState().addLocalConnector(newConnector);
      }

      return currentDiagram;
    },

    updateConnectorLabel: async (diagramId: string, connectorId: string, newLabel: string) => {
      try {
        // Get current connector to capture old label
        const currentConnector = await get()._internalGetConnector(diagramId, connectorId);
        if (!currentConnector) {
          throw new Error(`Connector ${connectorId} not found`);
        }

        // Create and execute command
        const command = commandFactory.createUpdateConnectorLabel(
          diagramId,
          connectorId,
          currentConnector.label,
          newLabel
        );
        await commandManager.execute(command, diagramId);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to update connector label');
        set((state) => ({
          errors: { ...state.errors, [diagramId]: err },
        }));
        throw error;
      }
    },

    deleteConnector: async (diagramId: string, connectorId: string) => {
      try {
        // Check if this is a sequence diagram before deleting
        const diagram = get().diagrams[diagramId];
        const isSequenceDiagram = diagram?.type === 'sequence';

        // Create and execute command
        const command = commandFactory.createDeleteConnector(diagramId, connectorId);
        await commandManager.execute(command, diagramId);

        // Refresh activation boxes and lifeline heights for sequence diagrams
        if (isSequenceDiagram) {
          // Get updated diagram after deletion
          const updatedDiagram = get().diagrams[diagramId];
          if (updatedDiagram) {
            // Calculate and update lifeline heights first
            const { calculateRequiredLifelineHeight } = await import(
              '~/design-studio/diagrams/sequence/heightCalculator'
            );
            const requiredHeight = calculateRequiredLifelineHeight(
              updatedDiagram.shapes,
              updatedDiagram.connectors || []
            );
            const heightCommand = commandFactory.createUpdateLifelineHeights(
              diagramId,
              requiredHeight
            );
            await commandManager.execute(heightCommand, diagramId);

            // Then refresh activation boxes
            const refreshCommand = commandFactory.createRefreshSequenceActivations(diagramId);
            await commandManager.execute(refreshCommand, diagramId);
          }
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to delete connector');
        set((state) => ({
          errors: { ...state.errors, [diagramId]: err },
        }));
        throw error;
      }
    },

    deleteConnectors: async (diagramId: string, connectorIds: string[]) => {
      try {
        // Create and execute batch delete command (single undo operation)
        const command = commandFactory.createBatchDeleteConnectors(diagramId, connectorIds);
        await commandManager.execute(command, diagramId);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to delete connectors');
        set((state) => ({
          errors: { ...state.errors, [diagramId]: err },
        }));
        throw error;
      }
    },

    _internalUpdateConnector: async (
      diagramId: string,
      connectorId: string,
      updates: Partial<Connector>
    ) => {
      const updatedDiagram = await diagramApi.updateConnector(diagramId, connectorId, updates);

      if (updatedDiagram) {
        set((state) => ({
          diagrams: { ...state.diagrams, [diagramId]: updatedDiagram },
        }));
      }

      return updatedDiagram;
    },

    _internalDeleteConnector: async (diagramId: string, connectorId: string) => {
      const updatedDiagram = await diagramApi.deleteConnector(diagramId, connectorId);

      if (updatedDiagram) {
        set((state) => ({
          diagrams: { ...state.diagrams, [diagramId]: updatedDiagram },
        }));

        // Update canvas instance local state
        const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
        canvasInstance.getState().removeLocalConnector(connectorId);
      }

      return updatedDiagram;
    },

    _internalRestoreConnector: async (diagramId: string, connector: Connector) => {
      const updatedDiagram = await diagramApi.restoreConnector(diagramId, connector);

      if (!updatedDiagram) {
        throw new Error(`Diagram ${diagramId} not found`);
      }

      set((state) => ({
        diagrams: { ...state.diagrams, [diagramId]: updatedDiagram },
      }));

      // Update canvas instance local state
      const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
      canvasInstance.getState().addLocalConnector(connector);

      return updatedDiagram;
    },

    _internalGetConnector: async (diagramId: string, connectorId: string) => {
      const diagram = get().diagrams[diagramId];
      if (!diagram) {
        return null;
      }

      const connector = diagram.connectors.find((c) => c.id === connectorId);
      return connector ?? null;
    },

    _internalDeleteConnectorsBatch: async (diagramId: string, connectorIds: string[]) => {
      if (connectorIds.length === 0) {
        return get().diagrams[diagramId] ?? null;
      }

      const updatedDiagram = await diagramApi.deleteConnectorsByIds(diagramId, connectorIds);

      if (updatedDiagram) {
        set((state) => ({
          diagrams: { ...state.diagrams, [diagramId]: updatedDiagram },
        }));

        // Update canvas instance local state - remove all connectors at once
        const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
        connectorIds.forEach((connectorId) => {
          canvasInstance.getState().removeLocalConnector(connectorId);
        });
      }

      return updatedDiagram;
    },

    _internalRestoreConnectorsBatch: async (diagramId: string, connectors: Connector[]) => {
      if (connectors.length === 0) {
        return get().diagrams[diagramId] ?? null;
      }

      const updatedDiagram = await diagramApi.restoreConnectors(diagramId, connectors);

      if (!updatedDiagram) {
        throw new Error(`Diagram ${diagramId} not found`);
      }

      set((state) => ({
        diagrams: { ...state.diagrams, [diagramId]: updatedDiagram },
      }));

      // Update canvas instance local state - add all connectors at once
      const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
      connectors.forEach((connector) => {
        canvasInstance.getState().addLocalConnector(connector);
      });

      return updatedDiagram;
    },

    // Utility actions
    // Internal method to update diagram mermaid syntax without triggering loading states
    // Used by useMermaidSync hook to persist cached mermaid export
    _internalUpdateDiagramMermaid: (diagramId: string, mermaidSyntax: string) => {
      const diagram = get().diagrams[diagramId];
      if (diagram) {
        set((state) => ({
          diagrams: {
            ...state.diagrams,
            [diagramId]: {
              ...diagram,
              mermaidSyntax,
              updatedAt: new Date(),
            },
          },
        }));
        // Persist to storage
        diagramApi.update(diagramId, { mermaidSyntax });
      }
    },
  };
});

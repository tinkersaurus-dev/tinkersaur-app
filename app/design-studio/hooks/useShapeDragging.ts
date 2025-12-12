import { useRef, useCallback, useEffect, useMemo } from 'react';
import type { Shape } from '~/core/entities/design-studio/types';
import type { ViewportTransform } from '../utils/viewport';
import { snapToGrid } from '../utils/canvas';
import type { DragData } from './useInteractionState';
import {
  findContainerAtPosition,
  getAllDescendantIds,
} from '../utils/containment-utils';
import { throttle } from '../utils/throttle';

interface UseShapeDraggingProps {
  viewportTransform: ViewportTransform;
  gridSnappingEnabled: boolean;
  localShapes: Shape[];
  updateLocalShapes: (updates: Map<string, Partial<Shape>>) => void;
  updateShapes?: (shapeUpdates: Array<{ shapeId: string; updates: Partial<Shape> }>) => Promise<void>;
  shapes: Shape[];
  isActive: boolean; // Driven by state machine
  dragData: DragData | null; // From state machine
  diagramId: string;
  commandFactory: import('~/core/commands/CommandFactory').CommandFactory;
  executeCommand: (command: import('~/core/commands/command.types').Command) => Promise<void>;
  setHoveredContainerId?: (id: string | null) => void; // For visual feedback
}

interface UseShapeDraggingReturn {
  startDragging: (canvasX: number, canvasY: number, shapesToDrag: string[]) => DragData;
  updateDragging: (screenX: number, screenY: number, containerRect: DOMRect) => { x: number; y: number };
  finishDragging: () => void;
}

/**
 * Hook for managing shape dragging interactions
 * State is managed externally by the interaction state machine
 * Handles parent-child containment relationships on drop
 */
export function useShapeDragging({
  viewportTransform,
  gridSnappingEnabled,
  localShapes,
  updateLocalShapes,
  updateShapes,
  shapes,
  isActive,
  dragData,
  diagramId,
  commandFactory,
  executeCommand,
  setHoveredContainerId,
}: UseShapeDraggingProps): UseShapeDraggingReturn {
  const shapesStartPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const rafIdRef = useRef<number | null>(null);
  const pendingUpdatesRef = useRef<Map<string, Partial<Shape>> | null>(null);

  // Throttle containment detection to 30fps (33ms) - this is expensive and only for visual feedback
  const throttledContainerDetection = useMemo(
    () =>
      throttle(
        (
          tempShape: Shape,
          shapes: Shape[],
          excludeIds: Set<string>,
          callback: (id: string | null) => void
        ) => {
          const container = findContainerAtPosition(tempShape, shapes, excludeIds);
          callback(container?.id ?? null);
        },
        33
      ),
    []
  );

  const startDragging = useCallback(
    (canvasX: number, canvasY: number, shapesToDrag: string[]): DragData => {
      // Prepare for dragging: store original positions of shapes to drag
      const positionsMap = new Map<string, { x: number; y: number }>();

      shapes.forEach((shape) => {
        if (shapesToDrag.includes(shape.id)) {
          positionsMap.set(shape.id, { x: shape.x, y: shape.y });
        }
      });

      shapesStartPositionsRef.current = positionsMap;

      return {
        startCanvasPos: { x: canvasX, y: canvasY },
        shapesStartPositions: positionsMap,
        delta: null,
      };
    },
    [shapes]
  );

  const updateDragging = useCallback(
    (screenX: number, screenY: number, _containerRect: DOMRect): { x: number; y: number } => {
      if (!isActive || !dragData) return { x: 0, y: 0 };

      // Convert current mouse position to canvas coordinates
      const { x: currentCanvasX, y: currentCanvasY } = viewportTransform.screenToCanvas(
        screenX,
        screenY
      );

      // Calculate delta in canvas space
      const deltaX = currentCanvasX - dragData.startCanvasPos.x;
      const deltaY = currentCanvasY - dragData.startCanvasPos.y;

      // Update LOCAL state only (ephemeral, not persisted)
      // Build batch update map for performance
      const updates = new Map<string, Partial<Shape>>();
      const draggedShapeIds = Array.from(shapesStartPositionsRef.current.keys());

      shapesStartPositionsRef.current.forEach((startPos, shapeId) => {
        let newX = startPos.x + deltaX;
        let newY = startPos.y + deltaY;

        // Apply grid snapping if enabled
        if (gridSnappingEnabled) {
          newX = snapToGrid(newX);
          newY = snapToGrid(newY);
        }

        updates.set(shapeId, {
          x: newX,
          y: newY,
        });
      });

      // Visual feedback: detect which container the first dragged shape is over
      // Only check the primary shape (first one in the list)
      // Throttled to 30fps since this is expensive and only for visual feedback
      if (setHoveredContainerId && draggedShapeIds.length > 0) {
        const primaryShapeId = draggedShapeIds[0];
        const updatedPosition = updates.get(primaryShapeId);

        if (updatedPosition) {
          const currentShape = localShapes.find(s => s.id === primaryShapeId);
          if (currentShape) {
            // Create a temporary shape with updated position for containment check
            const tempShape: Shape = {
              ...currentShape,
              x: updatedPosition.x ?? currentShape.x,
              y: updatedPosition.y ?? currentShape.y,
            };

            // Build exclusion set: shape itself and descendants (not ancestors - we need to detect current parent)
            const excludeIds = new Set<string>([primaryShapeId]);
            const descendants = getAllDescendantIds(primaryShapeId, localShapes);
            descendants.forEach(id => excludeIds.add(id));

            // Use throttled detection for visual feedback
            throttledContainerDetection(tempShape, localShapes, excludeIds, setHoveredContainerId);
          }
        }
      }

      // Store pending updates
      pendingUpdatesRef.current = updates;

      // Cancel any pending RAF
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      // Schedule update on next animation frame (batches updates to ~60fps max)
      rafIdRef.current = requestAnimationFrame(() => {
        if (pendingUpdatesRef.current) {
          updateLocalShapes(pendingUpdatesRef.current);
          pendingUpdatesRef.current = null;
        }
        rafIdRef.current = null;
      });

      // Return delta for state machine
      return { x: deltaX, y: deltaY };
    },
    [isActive, dragData, viewportTransform, gridSnappingEnabled, updateLocalShapes, localShapes, setHoveredContainerId, throttledContainerDetection]
  );

  const finishDragging = useCallback(async () => {
    // Cancel throttled container detection
    throttledContainerDetection.cancel();

    // Clear hovered container visual feedback
    if (setHoveredContainerId) {
      setHoveredContainerId(null);
    }

    // Cancel any pending RAF and flush final update
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // Flush any pending updates immediately to ensure final position is accurate
    if (pendingUpdatesRef.current) {
      updateLocalShapes(pendingUpdatesRef.current);
      pendingUpdatesRef.current = null;
    }

    // Create composite command for undo/redo if there was any drag
    if (dragData?.delta && (dragData.delta.x !== 0 || dragData.delta.y !== 0) && updateShapes) {
      // Batch all shape updates into a single composite command
      // Use the actual positions from localShapes (which may have been snapped)
      const shapeUpdates = Array.from(shapesStartPositionsRef.current.entries()).map(
        ([shapeId, startPos]) => {
          const currentShape = localShapes.find(s => s.id === shapeId);
          return {
            shapeId,
            updates: {
              x: currentShape?.x ?? startPos.x + dragData.delta!.x,
              y: currentShape?.y ?? startPos.y + dragData.delta!.y,
            },
          };
        }
      );
      await updateShapes(shapeUpdates);

      // After position update, handle parent-child relationships
      // Only check the first dragged shape (primary shape)
      const draggedShapeIds = Array.from(shapesStartPositionsRef.current.keys());
      if (draggedShapeIds.length > 0) {
        const primaryShapeId = draggedShapeIds[0];
        const currentShape = localShapes.find(s => s.id === primaryShapeId);

        if (currentShape) {
          // Build exclusion set: shape itself and descendants (not ancestors - we need to detect current parent)
          const excludeIds = new Set<string>([primaryShapeId]);
          const descendants = getAllDescendantIds(primaryShapeId, localShapes);
          descendants.forEach(id => excludeIds.add(id));

          // Find which container (if any) the shape should belong to
          const newContainer = findContainerAtPosition(currentShape, localShapes, excludeIds);
          const newParentId = newContainer?.id;

          // Only update if parent relationship changed
          if (newParentId !== currentShape.parentId) {
            // Import command for side effects (ensures command is registered)
            await import('~/core/commands/canvas/shapes/UpdateParentChildCommand');
            const command = commandFactory.createUpdateParentChildCommand(
              diagramId,
              primaryShapeId,
              newParentId
            );
            await executeCommand(command);
          }
        }
      }
    }

    // Clear internal refs
    shapesStartPositionsRef.current.clear();
  }, [dragData, updateShapes, localShapes, updateLocalShapes, setHoveredContainerId, diagramId, commandFactory, executeCommand, throttledContainerDetection]);

  // Cleanup RAF and throttled functions on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      throttledContainerDetection.cancel();
    };
  }, [throttledContainerDetection]);

  return {
    startDragging,
    updateDragging,
    finishDragging,
  };
}

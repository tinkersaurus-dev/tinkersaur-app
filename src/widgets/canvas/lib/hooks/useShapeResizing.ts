import { useRef, useCallback, useEffect } from 'react';
import type { Shape } from '@/entities/shape';
import type { ViewportTransform } from '../utils/viewport';
import type { ResizeData } from './useInteractionState';
import type { ResizeHandle, Bounds, DominantAxis } from '../utils/resize';
import {
  calculateResizeBounds,
  getChildrenBounds,
  isCornerHandle,
  determineDominantAxis,
} from '../utils/resize';

interface UseShapeResizingProps {
  viewportTransform: ViewportTransform;
  gridSnappingEnabled: boolean;
  localShapes: Shape[];
  updateLocalShapes: (updates: Map<string, Partial<Shape>>) => void;
  updateShapes?: (
    shapeUpdates: Array<{ shapeId: string; updates: Partial<Shape> }>
  ) => Promise<void>;
  shapes: Shape[];
  isActive: boolean; // Driven by state machine
  resizeData: ResizeData | null; // From state machine
  diagramId: string;
  commandFactory: import('@/features/canvas-commands/model/CommandFactory').CommandFactory;
  executeCommand: (
    command: import('@/features/canvas-commands/model/command.types').Command
  ) => Promise<void>;
}

interface UseShapeResizingReturn {
  startResizing: (
    canvasX: number,
    canvasY: number,
    handle: ResizeHandle,
    shapesToResize: string[]
  ) => ResizeData;
  updateResizing: (
    screenX: number,
    screenY: number,
    containerRect: DOMRect
  ) => { x: number; y: number };
  finishResizing: () => void;
}

/**
 * Hook for managing shape resizing interactions
 * State is managed externally by the interaction state machine
 */
export function useShapeResizing({
  viewportTransform,
  gridSnappingEnabled,
  localShapes,
  updateLocalShapes,
  updateShapes,
  shapes,
  isActive,
  resizeData,
  diagramId,
  commandFactory,
  executeCommand,
}: UseShapeResizingProps): UseShapeResizingReturn {
  const originalBoundsRef = useRef<Map<string, Bounds>>(new Map());
  const rafIdRef = useRef<number | null>(null);
  const pendingUpdatesRef = useRef<Map<string, Partial<Shape>> | null>(null);

  const startResizing = useCallback(
    (
      canvasX: number,
      canvasY: number,
      handle: ResizeHandle,
      shapesToResize: string[]
    ): ResizeData => {
      // Store original bounds, aspect ratios, and children bounds for all shapes
      const boundsMap = new Map<string, Bounds>();
      const aspectRatios = new Map<string, number>();
      const childrenBoundsMap = new Map<string, Bounds | null>();

      shapes.forEach((shape) => {
        if (shapesToResize.includes(shape.id)) {
          const bounds: Bounds = {
            x: shape.x,
            y: shape.y,
            width: shape.width,
            height: shape.height,
          };
          boundsMap.set(shape.id, bounds);

          // Calculate aspect ratio for corner handles
          if (isCornerHandle(handle)) {
            aspectRatios.set(shape.id, shape.width / shape.height);
          }

          // Calculate children bounds for constraint checking
          const childBounds = getChildrenBounds(shape, shapes);
          childrenBoundsMap.set(shape.id, childBounds);
        }
      });

      originalBoundsRef.current = boundsMap;

      return {
        handle,
        startCanvasPos: { x: canvasX, y: canvasY },
        shapesOriginalBounds: boundsMap,
        aspectRatios,
        childrenBounds: childrenBoundsMap,
        delta: null,
        dominantAxis: null, // Will be locked on first significant movement
      };
    },
    [shapes]
  );

  // Ref to track the locked dominant axis (persists across renders during resize)
  const lockedAxisRef = useRef<DominantAxis>(null);

  const updateResizing = useCallback(
    (
      screenX: number,
      screenY: number,
      _containerRect: DOMRect
    ): { x: number; y: number } => {
      if (!isActive || !resizeData) return { x: 0, y: 0 };

      // Convert current mouse position to canvas coordinates
      const { x: currentCanvasX, y: currentCanvasY } =
        viewportTransform.screenToCanvas(screenX, screenY);

      // Calculate delta in canvas space
      const deltaX = currentCanvasX - resizeData.startCanvasPos.x;
      const deltaY = currentCanvasY - resizeData.startCanvasPos.y;

      // For corner handles with aspect ratio, lock the dominant axis on first significant movement
      // This prevents discontinuous jumps when the axis switches mid-resize
      let currentDominantAxis = lockedAxisRef.current;
      if (isCornerHandle(resizeData.handle) && currentDominantAxis === null) {
        // Get average aspect ratio for determining axis (use first shape's ratio)
        const firstAspectRatio = resizeData.aspectRatios.values().next().value ?? 1;
        const determinedAxis = determineDominantAxis(deltaX, deltaY, firstAspectRatio);
        if (determinedAxis !== null) {
          // Lock the axis for the rest of this resize operation
          lockedAxisRef.current = determinedAxis;
          currentDominantAxis = determinedAxis;
        }
      }

      // Build batch update map for performance
      const updates = new Map<string, Partial<Shape>>();

      resizeData.shapesOriginalBounds.forEach((originalBounds, shapeId) => {
        const aspectRatio = resizeData.aspectRatios.get(shapeId);
        const childrenBounds = resizeData.childrenBounds.get(shapeId) ?? null;

        const newBounds = calculateResizeBounds(
          originalBounds,
          resizeData.handle,
          deltaX,
          deltaY,
          childrenBounds,
          gridSnappingEnabled,
          aspectRatio,
          currentDominantAxis
        );

        updates.set(shapeId, {
          x: newBounds.x,
          y: newBounds.y,
          width: newBounds.width,
          height: newBounds.height,
        });
      });

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
    [isActive, resizeData, viewportTransform, gridSnappingEnabled, updateLocalShapes]
  );

  const finishResizing = useCallback(async () => {
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

    // Create command for undo/redo if there was any resize
    if (
      resizeData?.delta &&
      (resizeData.delta.x !== 0 || resizeData.delta.y !== 0) &&
      updateShapes
    ) {
      // Build shape updates from original and current bounds
      const shapeUpdates = Array.from(originalBoundsRef.current.entries()).map(
        ([shapeId, fromBounds]) => {
          const currentShape = localShapes.find((s) => s.id === shapeId);
          const toBounds: Bounds = currentShape
            ? {
                x: currentShape.x,
                y: currentShape.y,
                width: currentShape.width,
                height: currentShape.height,
              }
            : fromBounds;

          return {
            shapeId,
            fromBounds,
            toBounds,
          };
        }
      );

      // Only create command if bounds actually changed
      const hasChanges = shapeUpdates.some(
        ({ fromBounds, toBounds }) =>
          fromBounds.x !== toBounds.x ||
          fromBounds.y !== toBounds.y ||
          fromBounds.width !== toBounds.width ||
          fromBounds.height !== toBounds.height
      );

      if (hasChanges) {
        // Import command for side effects (ensures command is registered)
        await import('@/features/canvas-commands/commands/shapes/ResizeShapesCommand');
        const command = commandFactory.createResizeShapes(diagramId, shapeUpdates);
        await executeCommand(command);
      }
    }

    // Clear internal refs
    originalBoundsRef.current.clear();
    lockedAxisRef.current = null;
  }, [
    resizeData,
    updateShapes,
    localShapes,
    updateLocalShapes,
    diagramId,
    commandFactory,
    executeCommand,
  ]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return {
    startResizing,
    updateResizing,
    finishResizing,
  };
}

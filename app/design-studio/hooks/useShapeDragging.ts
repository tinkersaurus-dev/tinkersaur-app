import { useRef, useCallback, useState } from 'react';
import type { Shape } from '~/core/entities/design-studio/types';
import { screenToCanvas, snapToGrid } from '../utils/canvas';

interface UseShapeDraggingProps {
  zoom: number;
  panX: number;
  panY: number;
  gridSnappingEnabled: boolean;
  localShapes: Shape[];
  updateLocalShapes: (updates: Map<string, Partial<Shape>>) => void;
  updateShapes?: (shapeUpdates: Array<{ shapeId: string; updates: Partial<Shape> }>) => Promise<void>;
  _selectedShapeIds: string[];
  _setSelectedShapes: (shapeIds: string[]) => void;
  shapes: Shape[];
  _lastMousePosRef: React.MutableRefObject<{ x: number; y: number }>;
}

interface UseShapeDraggingReturn {
  isDraggingShapesRef: React.MutableRefObject<boolean>;
  dragStartCanvasPosRef: React.MutableRefObject<{ x: number; y: number } | null>;
  shapesStartPositionsRef: React.MutableRefObject<Map<string, { x: number; y: number }>>;
  dragDelta: { x: number; y: number } | null;
  startDragging: (canvasX: number, canvasY: number, shapesToDrag: string[]) => void;
  updateDragging: (screenX: number, screenY: number, containerRect: DOMRect) => void;
  finishDragging: () => void;
}

/**
 * Hook for managing shape dragging interactions
 */
export function useShapeDragging({
  zoom,
  panX,
  panY,
  gridSnappingEnabled,
  localShapes,
  updateLocalShapes,
  updateShapes,
  _selectedShapeIds,
  _setSelectedShapes,
  shapes,
  _lastMousePosRef,
}: UseShapeDraggingProps): UseShapeDraggingReturn {
  const isDraggingShapesRef = useRef(false);
  const dragStartCanvasPosRef = useRef<{ x: number; y: number } | null>(null);
  const shapesStartPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const [dragDelta, setDragDelta] = useState<{ x: number; y: number } | null>(null);

  const startDragging = useCallback(
    (canvasX: number, canvasY: number, shapesToDrag: string[]) => {
      // Prepare for dragging: store original positions of shapes to drag
      const positionsMap = new Map<string, { x: number; y: number }>();

      shapes.forEach((shape) => {
        if (shapesToDrag.includes(shape.id)) {
          positionsMap.set(shape.id, { x: shape.x, y: shape.y });
        }
      });

      shapesStartPositionsRef.current = positionsMap;
      isDraggingShapesRef.current = true;
      dragStartCanvasPosRef.current = { x: canvasX, y: canvasY };
    },
    [shapes]
  );

  const updateDragging = useCallback(
    (screenX: number, screenY: number, _containerRect: DOMRect) => {
      if (!isDraggingShapesRef.current || !dragStartCanvasPosRef.current) return;

      // Convert current mouse position to canvas coordinates
      const { x: currentCanvasX, y: currentCanvasY } = screenToCanvas(
        screenX,
        screenY,
        zoom,
        panX,
        panY
      );

      // Calculate delta in canvas space
      const deltaX = currentCanvasX - dragStartCanvasPosRef.current.x;
      const deltaY = currentCanvasY - dragStartCanvasPosRef.current.y;

      // Update LOCAL state only (ephemeral, not persisted)
      // Build batch update map for performance
      const updates = new Map<string, Partial<Shape>>();
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

      // Single batch update to local state
      updateLocalShapes(updates);

      // Store delta for command creation on mouseup
      setDragDelta({ x: deltaX, y: deltaY });
    },
    [zoom, panX, panY, gridSnappingEnabled, updateLocalShapes]
  );

  const finishDragging = useCallback(() => {
    // Create composite command for undo/redo if there was any drag
    if (dragDelta && (dragDelta.x !== 0 || dragDelta.y !== 0) && updateShapes) {
      // Batch all shape updates into a single composite command
      // Use the actual positions from localShapes (which may have been snapped)
      const shapeUpdates = Array.from(shapesStartPositionsRef.current.entries()).map(
        ([shapeId, startPos]) => {
          const currentShape = localShapes.find(s => s.id === shapeId);
          return {
            shapeId,
            updates: {
              x: currentShape?.x ?? startPos.x + dragDelta.x,
              y: currentShape?.y ?? startPos.y + dragDelta.y,
            },
          };
        }
      );
      updateShapes(shapeUpdates);
    }

    // Clear drag state
    isDraggingShapesRef.current = false;
    dragStartCanvasPosRef.current = null;
    shapesStartPositionsRef.current.clear();
    setDragDelta(null);
  }, [dragDelta, updateShapes, localShapes]);

  return {
    isDraggingShapesRef,
    dragStartCanvasPosRef,
    shapesStartPositionsRef,
    dragDelta,
    startDragging,
    updateDragging,
    finishDragging,
  };
}

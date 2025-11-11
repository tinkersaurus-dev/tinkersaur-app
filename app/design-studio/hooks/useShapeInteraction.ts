import { useCallback } from 'react';
import type { RefObject, MutableRefObject } from 'react';
import { screenToCanvas } from '../utils/canvas';

interface UseShapeInteractionProps {
  // Viewport state for coordinate transformation
  zoom: number;
  panX: number;
  panY: number;

  // Selection state management
  selectedShapeIds: string[];
  setSelectedShapes: (shapeIds: string[]) => void;

  // Hover state management
  setHoveredShapeId: (shapeId: string | null) => void;

  // Drag initialization callback
  startDragging: (canvasX: number, canvasY: number, shapesToDrag: string[]) => void;

  // Shared refs
  containerRef: RefObject<HTMLDivElement | null>;
  lastMousePosRef: MutableRefObject<{ x: number; y: number }>;
}

interface UseShapeInteractionReturn {
  handleShapeMouseDown: (e: React.MouseEvent, shapeId: string) => void;
  handleShapeMouseEnter: (e: React.MouseEvent, shapeId: string) => void;
  handleShapeMouseLeave: (e: React.MouseEvent, shapeId: string) => void;
}

/**
 * Hook for managing shape interaction (selection, hover, drag initialization)
 *
 * Handles:
 * - Single and multi-select with modifier keys (Shift/Ctrl/Cmd)
 * - Hover state tracking
 * - Drag initialization coordination with useShapeDragging
 * - Event propagation control
 *
 * @param props - Configuration for shape interaction
 * @returns Event handlers for shape mouse events
 */
export function useShapeInteraction({
  zoom,
  panX,
  panY,
  selectedShapeIds,
  setSelectedShapes,
  setHoveredShapeId,
  startDragging,
  containerRef,
  lastMousePosRef,
}: UseShapeInteractionProps): UseShapeInteractionReturn {

  // Handle shape mouse down for selection and drag initialization
  const handleShapeMouseDown = useCallback(
    (e: React.MouseEvent, shapeId: string) => {
      // Stop propagation to prevent canvas background click
      e.stopPropagation();

      // Only handle left mouse button
      if (e.button !== 0) return;

      const container = containerRef.current;
      if (!container) return;

      // Get mouse position in screen and canvas coordinates
      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const { x: canvasX, y: canvasY } = screenToCanvas(
        screenX,
        screenY,
        zoom,
        panX,
        panY
      );

      // Check for multi-select modifiers (Shift, Ctrl, or Cmd on Mac)
      const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;

      // Determine which shapes will be dragged BEFORE modifying selection
      let shapesToDrag: string[];

      if (isMultiSelect) {
        // Toggle shape in selection
        if (selectedShapeIds.includes(shapeId)) {
          // Remove from selection
          setSelectedShapes(selectedShapeIds.filter((id) => id !== shapeId));
          // Don't start dragging if we just deselected
          return;
        } else {
          // Add to selection
          const newSelection = [...selectedShapeIds, shapeId];
          setSelectedShapes(newSelection);
          // Drag all newly selected shapes
          shapesToDrag = newSelection;
        }
      } else {
        // If clicking on a non-selected shape, select only that shape
        if (!selectedShapeIds.includes(shapeId)) {
          setSelectedShapes([shapeId]);
          shapesToDrag = [shapeId];
        } else {
          // Clicking on a selected shape - drag all currently selected shapes
          shapesToDrag = selectedShapeIds;
        }
      }

      // Start dragging
      startDragging(canvasX, canvasY, shapesToDrag);
      lastMousePosRef.current = { x: screenX, y: screenY };
    },
    [selectedShapeIds, setSelectedShapes, panX, panY, zoom, startDragging, containerRef, lastMousePosRef]
  );

  // Handle shape mouse enter for hover state
  const handleShapeMouseEnter = useCallback(
    (e: React.MouseEvent, shapeId: string) => {
      setHoveredShapeId(shapeId);
    },
    [setHoveredShapeId]
  );

  // Handle shape mouse leave for hover state
  const handleShapeMouseLeave = useCallback(
    (_e: React.MouseEvent, _shapeId: string) => {
      setHoveredShapeId(null);
    },
    [setHoveredShapeId]
  );

  return {
    handleShapeMouseDown,
    handleShapeMouseEnter,
    handleShapeMouseLeave,
  };
}

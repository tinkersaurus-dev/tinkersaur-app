import { useCallback } from 'react';

/**
 * Props for the useCanvasMouseOrchestration hook
 */
export interface UseCanvasMouseOrchestrationProps {
  // Refs
  containerRef: React.RefObject<HTMLDivElement>;

  // Panning state and controls
  isPanning: boolean;
  startPanning: (clientX: number, clientY: number) => void;
  updatePanning: (clientX: number, clientY: number) => void;
  stopPanning: () => void;

  // Selection box state and controls
  selectionBox: { startX: number; startY: number; endX: number; endY: number } | null;
  isSelectingRef: React.MutableRefObject<boolean>;
  startSelection: (screenX: number, screenY: number) => void;
  updateSelection: (screenX: number, screenY: number) => void;
  finishSelection: (screenX: number, screenY: number) => void;

  // Connector drawing state and controls
  drawingConnector: any | null;
  updateDrawingConnector: (screenX: number, screenY: number) => void;
  cancelDrawingConnector: () => void;

  // Shape dragging state and controls
  isDraggingShapesRef: React.MutableRefObject<boolean>;
  dragStartCanvasPosRef: React.MutableRefObject<any>;
  updateDragging: (screenX: number, screenY: number, rect: DOMRect) => void;
  finishDragging: () => void;
}

/**
 * Return value from the useCanvasMouseOrchestration hook
 */
export interface UseCanvasMouseOrchestrationReturn {
  handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * Orchestrates mouse events for the canvas with priority-based routing.
 *
 * This hook consolidates all mouse interaction handling for the canvas, implementing
 * a strict priority system to ensure only one interaction type processes each event:
 *
 * Priority Levels (in handleMouseMove):
 * - Priority 0 (Highest): Drawing Connector - Takes precedence when drawing connections
 * - Priority 1: Panning - Canvas dragging with middle mouse or during pan mode
 * - Priority 2: Dragging Shapes - Moving selected shapes
 * - Priority 3 (Lowest): Selection Box - Drag-selecting multiple shapes
 *
 * Each priority level uses early returns to prevent lower priorities from processing
 * the same event, avoiding conflicts between simultaneous interactions.
 *
 * @param props - Configuration object containing state and control functions from multiple hooks
 * @returns Object containing the three main mouse event handlers
 */
export function useCanvasMouseOrchestration(
  props: UseCanvasMouseOrchestrationProps
): UseCanvasMouseOrchestrationReturn {
  const {
    containerRef,
    isPanning,
    startPanning,
    updatePanning,
    stopPanning,
    selectionBox,
    isSelectingRef,
    startSelection,
    updateSelection,
    finishSelection,
    drawingConnector,
    updateDrawingConnector,
    cancelDrawingConnector,
    isDraggingShapesRef,
    dragStartCanvasPosRef,
    updateDragging,
    finishDragging,
  } = props;

  /**
   * Handle mouse down for panning and selection
   */
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1) {  // Middle mouse button
      e.preventDefault();
      startPanning(e.clientX, e.clientY);
    } else if (e.button === 0) {  // Left mouse button - start selection box
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      startSelection(screenX, screenY);
    }
  }, [startPanning, startSelection, containerRef]);

  /**
   * Handle mouse move for panning, dragging, and selection box
   * Implements priority-based routing with early returns
   */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Priority 0: Drawing connector (highest priority)
    if (drawingConnector) {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      updateDrawingConnector(screenX, screenY);
      return;
    }

    // Priority 1: Panning
    if (isPanning) {
      updatePanning(e.clientX, e.clientY);
      return;
    }

    // Priority 2: Dragging shapes
    if (isDraggingShapesRef.current && dragStartCanvasPosRef.current) {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      updateDragging(screenX, screenY, rect);
      return;
    }

    // Priority 3: Selection box dragging
    if (isSelectingRef.current && selectionBox) {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      updateSelection(screenX, screenY);
    }
  }, [
    selectionBox,
    drawingConnector,
    isPanning,
    updatePanning,
    updateDrawingConnector,
    updateSelection,
    updateDragging,
    dragStartCanvasPosRef,
    isDraggingShapesRef,
    isSelectingRef,
    containerRef,
  ]);

  /**
   * Handle mouse up for panning, dragging, and selection box
   * Processes completions/cancellations in priority order
   */
  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Handle drawing connector - cancel if released on canvas (not on a connection point)
      if (drawingConnector) {
        cancelDrawingConnector();
        return;
      }

      // Handle panning
      if (isPanning) {
        stopPanning();
        return;
      }

      // Handle drag shapes end
      if (e.button === 0 && isDraggingShapesRef.current) {
        finishDragging();
        return;
      }

      // Handle selection box
      if (e.button === 0 && isSelectingRef.current) {
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        finishSelection(screenX, screenY);
      }
    },
    [
      isPanning,
      stopPanning,
      drawingConnector,
      cancelDrawingConnector,
      isSelectingRef,
      finishSelection,
      finishDragging,
      isDraggingShapesRef,
      containerRef,
    ]
  );

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}

import { useCallback } from 'react';
import type { InteractionMode, SelectionBox } from '../../hooks/useInteractionState';

/**
 * Props for the useCanvasMouseOrchestration hook
 */
export interface UseCanvasMouseOrchestrationProps {
  // Refs
  containerRef: React.RefObject<HTMLDivElement | null>;

  // State machine
  mode: InteractionMode;
  selectionBox: SelectionBox | null;

  // Mode transition functions
  onStartPanning: () => void;
  onStartSelecting: (box: SelectionBox) => void;

  // Panning controls
  startPanning: (clientX: number, clientY: number) => void;
  updatePanning: (clientX: number, clientY: number) => void;
  stopPanning: () => void;

  // Selection box controls
  startSelection: (screenX: number, screenY: number) => SelectionBox;
  updateSelection: (screenX: number, screenY: number) => SelectionBox;
  finishSelection: (screenX: number, screenY: number) => void;
  onUpdateSelecting: (box: SelectionBox) => void;

  // Connector drawing controls
  updateDrawingConnector: (screenX: number, screenY: number) => { currentX: number; currentY: number };
  onUpdateDrawingConnector: (currentX: number, currentY: number) => void;
  onCancelDrawingConnector: () => void;

  // Shape dragging controls
  updateDragging: (screenX: number, screenY: number, rect: DOMRect) => { x: number; y: number };
  finishDragging: () => void;
  onUpdateDragging: (delta: { x: number; y: number }) => void;
  onFinishInteraction: () => void;
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
 * Orchestrates mouse events for the canvas using state machine-based routing.
 *
 * This hook consolidates all mouse interaction handling for the canvas, using
 * the interaction state machine to ensure only one interaction is active at a time.
 *
 * The state machine guarantees mutual exclusivity - only one mode can be active,
 * preventing conflicts between simultaneous interactions.
 *
 * @param props - Configuration object containing state machine state and control functions
 * @returns Object containing the three main mouse event handlers
 */
export function useCanvasMouseOrchestration(
  props: UseCanvasMouseOrchestrationProps
): UseCanvasMouseOrchestrationReturn {
  const {
    containerRef,
    mode,
    selectionBox,
    onStartPanning,
    onStartSelecting,
    startPanning,
    updatePanning,
    stopPanning,
    startSelection,
    updateSelection,
    finishSelection,
    onUpdateSelecting,
    updateDrawingConnector,
    onUpdateDrawingConnector,
    onCancelDrawingConnector,
    updateDragging,
    finishDragging,
    onUpdateDragging,
    onFinishInteraction,
  } = props;

  /**
   * Handle mouse down for panning and selection
   */
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1) {  // Middle mouse button
      e.preventDefault();
      startPanning(e.clientX, e.clientY);
      onStartPanning();
    } else if (e.button === 0) {  // Left mouse button - start selection box
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      const box = startSelection(screenX, screenY);
      onStartSelecting(box);
    }
  }, [startPanning, onStartPanning, startSelection, onStartSelecting, containerRef]);

  /**
   * Handle mouse move based on current mode
   * State machine ensures only one case matches
   */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    switch (mode) {
      case 'drawing-connector': {
        const { currentX, currentY } = updateDrawingConnector(screenX, screenY);
        onUpdateDrawingConnector(currentX, currentY);
        break;
      }

      case 'panning':
        updatePanning(e.clientX, e.clientY);
        break;

      case 'dragging-shapes': {
        const delta = updateDragging(screenX, screenY, rect);
        onUpdateDragging(delta);
        break;
      }

      case 'selecting':
        if (selectionBox) {
          const updatedBox = updateSelection(screenX, screenY);
          onUpdateSelecting(updatedBox);
        }
        break;

      case 'idle':
        // No-op
        break;
    }
  }, [
    mode,
    selectionBox,
    updatePanning,
    updateDrawingConnector,
    onUpdateDrawingConnector,
    updateSelection,
    onUpdateSelecting,
    updateDragging,
    onUpdateDragging,
    containerRef,
  ]);

  /**
   * Handle mouse up based on current mode
   */
  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;

      switch (mode) {
        case 'drawing-connector':
          // Cancel if released on canvas (not on a connection point)
          onCancelDrawingConnector();
          break;

        case 'panning':
          stopPanning();
          onFinishInteraction();
          break;

        case 'dragging-shapes':
          if (e.button === 0) {
            finishDragging();
            onFinishInteraction();
          }
          break;

        case 'selecting':
          if (e.button === 0) {
            const rect = container.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;

            finishSelection(screenX, screenY);
            onFinishInteraction();
          }
          break;

        case 'idle':
          // No-op
          break;
      }
    },
    [
      mode,
      stopPanning,
      onCancelDrawingConnector,
      finishSelection,
      finishDragging,
      onFinishInteraction,
      containerRef,
    ]
  );

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}

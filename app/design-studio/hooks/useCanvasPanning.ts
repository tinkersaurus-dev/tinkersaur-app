import type { MutableRefObject } from 'react';
import type { ViewportTransform } from '../utils/viewport';

interface UseCanvasPanningProps {
  viewportTransform: ViewportTransform;
  lastMousePosRef: MutableRefObject<{ x: number; y: number }>;
  isActive: boolean; // Driven by state machine
}

interface UseCanvasPanningReturn {
  startPanning: (clientX: number, clientY: number) => void;
  updatePanning: (clientX: number, clientY: number) => void;
  stopPanning: () => void;
}

/**
 * Hook for managing canvas panning with middle mouse button
 * State is managed externally by the interaction state machine
 */
export function useCanvasPanning({
  viewportTransform,
  lastMousePosRef,
  isActive,
}: UseCanvasPanningProps): UseCanvasPanningReturn {
  const startPanning = (clientX: number, clientY: number) => {
    lastMousePosRef.current = { x: clientX, y: clientY };
  };

  const updatePanning = (clientX: number, clientY: number) => {
    if (!isActive) return;

    const deltaX = clientX - lastMousePosRef.current.x;
    const deltaY = clientY - lastMousePosRef.current.y;

    const { zoom, panX, panY } = viewportTransform.viewport;
    viewportTransform.setViewport(zoom, panX + deltaX, panY + deltaY);

    lastMousePosRef.current = { x: clientX, y: clientY };
  };

  const stopPanning = () => {
    // No state to clear - handled by state machine
  };

  return {
    startPanning,
    updatePanning,
    stopPanning,
  };
}

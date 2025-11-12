import type { MutableRefObject } from 'react';

interface UseCanvasPanningProps {
  setViewport: (zoom: number, panX: number, panY: number) => void;
  zoom: number;
  panX: number;
  panY: number;
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
  setViewport,
  zoom,
  panX,
  panY,
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

    setViewport(zoom, panX + deltaX, panY + deltaY);

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

import { useState } from 'react';
import type { MutableRefObject } from 'react';

interface UseCanvasPanningProps {
  setViewport: (zoom: number, panX: number, panY: number) => void;
  zoom: number;
  panX: number;
  panY: number;
  lastMousePosRef: MutableRefObject<{ x: number; y: number }>;
}

interface UseCanvasPanningReturn {
  isPanning: boolean;
  setIsPanning: (isPanning: boolean) => void;
  startPanning: (clientX: number, clientY: number) => void;
  updatePanning: (clientX: number, clientY: number) => void;
  stopPanning: () => void;
}

/**
 * Hook for managing canvas panning with middle mouse button
 */
export function useCanvasPanning({
  setViewport,
  zoom,
  panX,
  panY,
  lastMousePosRef,
}: UseCanvasPanningProps): UseCanvasPanningReturn {
  const [isPanning, setIsPanning] = useState(false);

  const startPanning = (clientX: number, clientY: number) => {
    setIsPanning(true);
    lastMousePosRef.current = { x: clientX, y: clientY };
  };

  const updatePanning = (clientX: number, clientY: number) => {
    if (!isPanning) return;

    const deltaX = clientX - lastMousePosRef.current.x;
    const deltaY = clientY - lastMousePosRef.current.y;

    setViewport(zoom, panX + deltaX, panY + deltaY);

    lastMousePosRef.current = { x: clientX, y: clientY };
  };

  const stopPanning = () => {
    setIsPanning(false);
  };

  return {
    isPanning,
    setIsPanning,
    startPanning,
    updatePanning,
    stopPanning,
  };
}

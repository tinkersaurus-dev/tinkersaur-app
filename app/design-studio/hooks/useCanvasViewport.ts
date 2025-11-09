import { useCallback, useEffect } from 'react';
import type { RefObject } from 'react';
import { calculateZoomFromWheel, calculateZoomToPoint } from '../utils/canvas';

interface UseCanvasViewportProps {
  containerRef: RefObject<HTMLDivElement | null>;
  zoom: number;
  panX: number;
  panY: number;
  setViewport: (zoom: number, panX: number, panY: number) => void;
}

/**
 * Hook for managing canvas viewport interactions (zoom via mouse wheel)
 */
export function useCanvasViewport({
  containerRef,
  zoom,
  panX,
  panY,
  setViewport,
}: UseCanvasViewportProps) {
  const handleWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();

      const container = containerRef.current;
      if (!container) return;

      // Get cursor position relative to container
      const rect = container.getBoundingClientRect();
      const cursorX = event.clientX - rect.left;
      const cursorY = event.clientY - rect.top;

      // Calculate new zoom
      const newZoom = calculateZoomFromWheel(zoom, event.deltaY);

      // Calculate new pan to zoom to cursor position
      const { panX: newPanX, panY: newPanY } = calculateZoomToPoint(
        cursorX,
        cursorY,
        zoom,
        newZoom,
        panX,
        panY
      );

      setViewport(newZoom, newPanX, newPanY);
    },
    [zoom, panX, panY, setViewport, containerRef]
  );

  // Attach wheel listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel, containerRef]);
}

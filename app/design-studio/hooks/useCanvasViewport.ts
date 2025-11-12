import { useCallback, useEffect } from 'react';
import type { RefObject } from 'react';
import type { ViewportTransform } from '../utils/viewport';

interface UseCanvasViewportProps {
  containerRef: RefObject<HTMLDivElement | null>;
  viewportTransform: ViewportTransform;
}

/**
 * Hook for managing canvas viewport interactions (zoom via mouse wheel)
 */
export function useCanvasViewport({
  containerRef,
  viewportTransform,
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

      // Calculate new zoom using viewport transform method
      const newZoom = viewportTransform.calculateZoomFromWheel(event.deltaY);

      // Calculate new pan to zoom to cursor position
      const { panX: newPanX, panY: newPanY } = viewportTransform.calculateZoomToPoint(
        cursorX,
        cursorY,
        newZoom
      );

      viewportTransform.setViewport(newZoom, newPanX, newPanY);
    },
    [viewportTransform, containerRef]
  );

  // Attach wheel listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel, containerRef]);
}

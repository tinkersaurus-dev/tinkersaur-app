import { useRef, useEffect, useCallback } from 'react';
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
 * Uses RAF batching to limit viewport updates to ~60fps
 */
export function useCanvasPanning({
  viewportTransform,
  lastMousePosRef,
  isActive,
}: UseCanvasPanningProps): UseCanvasPanningReturn {
  const rafIdRef = useRef<number | null>(null);
  const pendingDeltaRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const startPanning = useCallback((clientX: number, clientY: number) => {
    lastMousePosRef.current = { x: clientX, y: clientY };
    pendingDeltaRef.current = { x: 0, y: 0 };
  }, [lastMousePosRef]);

  const updatePanning = useCallback((clientX: number, clientY: number) => {
    if (!isActive) return;

    // Accumulate delta from last mouse position
    const deltaX = clientX - lastMousePosRef.current.x;
    const deltaY = clientY - lastMousePosRef.current.y;

    // Update last mouse position immediately to prevent delta accumulation errors
    lastMousePosRef.current = { x: clientX, y: clientY };

    // Accumulate deltas for batched update
    pendingDeltaRef.current.x += deltaX;
    pendingDeltaRef.current.y += deltaY;

    // Schedule viewport update on next animation frame if not already scheduled
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        const { zoom, panX, panY } = viewportTransform.viewport;
        viewportTransform.setViewport(
          zoom,
          panX + pendingDeltaRef.current.x,
          panY + pendingDeltaRef.current.y
        );
        pendingDeltaRef.current = { x: 0, y: 0 };
        rafIdRef.current = null;
      });
    }
  }, [isActive, lastMousePosRef, viewportTransform]);

  const stopPanning = useCallback(() => {
    // Cancel any pending RAF and flush final update
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // Apply any remaining pending delta
    if (pendingDeltaRef.current.x !== 0 || pendingDeltaRef.current.y !== 0) {
      const { zoom, panX, panY } = viewportTransform.viewport;
      viewportTransform.setViewport(
        zoom,
        panX + pendingDeltaRef.current.x,
        panY + pendingDeltaRef.current.y
      );
      pendingDeltaRef.current = { x: 0, y: 0 };
    }
  }, [viewportTransform]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return {
    startPanning,
    updatePanning,
    stopPanning,
  };
}

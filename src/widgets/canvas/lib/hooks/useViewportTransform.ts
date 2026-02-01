/**
 * useViewportTransform Hook
 *
 * Custom hook that extracts viewport state from canvas instance store and
 * creates a ViewportTransform object with all transformation methods bound.
 *
 * This reduces prop drilling by providing a single object instead of
 * separate zoom, panX, panY, and setViewport props.
 */

import { useMemo } from 'react';
import { useStore } from 'zustand';
import { createViewportTransform, type ViewportTransform } from '../utils/viewport';
import type { CanvasInstanceStore } from '@/app/model/stores/canvas/createCanvasInstanceStore';

/**
 * Extract viewport state and create ViewportTransform object
 *
 * @param canvasInstance - Canvas instance store for the current diagram
 * @returns ViewportTransform object with viewport state and transformation methods
 *
 * @example
 * ```tsx
 * function Canvas({ diagramId }) {
 *   const canvasInstance = useCanvasInstance(diagramId);
 *   const viewportTransform = useViewportTransform(canvasInstance);
 *
 *   // Use in hooks
 *   useCanvasSelection({ viewportTransform, ... });
 *
 *   // Use transformation methods
 *   const canvasPos = viewportTransform.screenToCanvas(mouseX, mouseY);
 * }
 * ```
 */
export function useViewportTransform(
  canvasInstance: CanvasInstanceStore
): ViewportTransform {
  // Extract viewport state from store using useStore hook
  const zoom = useStore(canvasInstance, (state) => state.viewportZoom);
  const panX = useStore(canvasInstance, (state) => state.viewportPanX);
  const panY = useStore(canvasInstance, (state) => state.viewportPanY);
  const setViewport = useStore(canvasInstance, (state) => state.setViewport);

  // Create ViewportTransform object with memoization
  // Only recreate when viewport values or setViewport change
  const viewportTransform = useMemo(
    () => createViewportTransform({ zoom, panX, panY }, setViewport),
    [zoom, panX, panY, setViewport]
  );

  return viewportTransform;
}

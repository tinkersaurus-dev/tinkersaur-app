import { canvasInstanceRegistry } from './canvasInstanceRegistry';
import type { CanvasInstanceStore } from './createCanvasInstanceStore';

/**
 * Use Canvas Instance Hook
 *
 * Returns the isolated Zustand store for a specific diagram instance.
 *
 * CRITICAL: Each diagram ID gets its own store instance from the registry.
 * This ensures complete isolation between multiple open canvases.
 *
 * @param diagramId - The ID of the diagram
 * @returns The Zustand store instance for this diagram
 *
 * @example
 * ```tsx
 * function Canvas({ diagramId }: { diagramId: string }) {
 *   const canvasInstance = useCanvasInstance(diagramId);
 *
 *   const zoom = canvasInstance((state) => state.viewportZoom);
 *   const setViewport = canvasInstance((state) => state.setViewport);
 *
 *   const handleZoom = () => {
 *     setViewport(zoom * 1.2, 0, 0);
 *   };
 *
 *   return <div>Zoom: {zoom}</div>;
 * }
 * ```
 */
export function useCanvasInstance(diagramId: string): CanvasInstanceStore {
  // Get or create the store for this diagram from the registry
  return canvasInstanceRegistry.getStore(diagramId);
}

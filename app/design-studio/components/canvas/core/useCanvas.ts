import { useCanvasDiagram } from './CanvasDiagramContext';
import { useCanvasViewport } from './CanvasViewportContext';
import { useCanvasSelection } from './CanvasSelectionContext';
import { useCanvasEvents } from './CanvasEventsContext';

/**
 * Composite hook that provides access to all canvas contexts
 *
 * This is a convenience hook that combines all 4 focused canvas contexts:
 * - CanvasDiagramContext (data)
 * - CanvasViewportContext (transform)
 * - CanvasSelectionContext (selection state)
 * - CanvasEventsContext (handlers)
 *
 * @returns Combined canvas context with all state and handlers
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const canvas = useCanvas();
 *   return <div>{canvas.diagram.shapes.length} shapes</div>;
 * }
 * ```
 *
 * For better performance, prefer using individual context hooks when you only need
 * a subset of the canvas state. This prevents unnecessary re-renders.
 *
 * @example
 * ```tsx
 * // Better performance - only re-renders when viewport changes
 * function ZoomIndicator() {
 *   const { viewportTransform } = useCanvasViewport();
 *   return <div>Zoom: {viewportTransform.viewport.zoom}%</div>;
 * }
 * ```
 */
export function useCanvas() {
  const diagram = useCanvasDiagram();
  const viewport = useCanvasViewport();
  const selection = useCanvasSelection();
  const events = useCanvasEvents();

  return {
    // Diagram context
    diagram,
    // Viewport context
    viewport,
    // Selection context
    selection,
    // Events context
    events,
  };
}

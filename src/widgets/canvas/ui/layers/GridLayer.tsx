import { memo } from 'react';
import { useCanvasViewport } from '../contexts/CanvasViewportContext';
import { useCanvasSelection } from '../contexts/CanvasSelectionContext';
import { GridBackground } from '../primitives/GridBackground';

/**
 * GridLayer Component
 *
 * Renders the grid background for the canvas.
 * Only subscribes to viewport and grid display mode contexts.
 *
 * Re-renders only when:
 * - Viewport changes (pan/zoom)
 * - Grid display mode changes
 *
 * Does NOT re-render when:
 * - Shapes/connectors change
 * - Selection/hover changes
 * - Menus open/close
 */
function GridLayerComponent() {
  const { viewportTransform } = useCanvasViewport();
  const { gridDisplayMode } = useCanvasSelection();

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full">
        <GridBackground
          gridSize={10}
          panX={viewportTransform.viewport.panX}
          panY={viewportTransform.viewport.panY}
          zoom={viewportTransform.viewport.zoom}
          mode={gridDisplayMode}
        />
      </svg>
    </div>
  );
}

export const GridLayer = memo(GridLayerComponent);

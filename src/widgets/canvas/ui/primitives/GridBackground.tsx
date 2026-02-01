/**
 * Grid Background Component
 *
 * Renders an infinite grid using SVG patterns.
 * Supports both dot and line grid modes.
 * The grid is rendered in screen space with pattern offsets calculated
 * to maintain alignment with canvas coordinates, creating a truly infinite grid.
 */

interface GridBackgroundProps {
  /** Grid spacing in pixels (default: 10) */
  gridSize?: number;
  /** Viewport pan X offset */
  panX: number;
  /** Viewport pan Y offset */
  panY: number;
  /** Viewport zoom level */
  zoom: number;
  /** Grid display mode: 'dots' or 'lines' (default: 'dots') */
  mode?: 'dots' | 'lines';
}

export function GridBackground({
  gridSize = 10,
  panX,
  panY,
  zoom,
  mode = 'dots'
}: GridBackgroundProps) {
  // Calculate pattern size scaled by zoom
  const patternSize = gridSize * zoom;

  // Calculate pattern offset to maintain alignment with canvas coordinates
  // Using modulo ensures the pattern seamlessly repeats
  const offsetX = panX % patternSize;
  const offsetY = panY % patternSize;

  // Scale dot size with zoom, with minimum size for visibility
  const dotRadius = Math.max(0.5, zoom);

  // Scale line width with zoom
  const lineWidth = Math.max(0.5, zoom * 0.5);

  const patternId = mode === 'dots' ? 'dot-grid' : 'line-grid';

  return (
    <>
      {/* Define the grid pattern */}
      <defs>
        <pattern
          id={patternId}
          width={patternSize}
          height={patternSize}
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          {mode === 'dots' ? (
            <circle
              cx={0}
              cy={0}
              r={dotRadius}
              fill="var(--grid-dots)"
            />
          ) : (
            <>
              {/* Vertical line */}
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={patternSize}
                stroke="var(--grid-lines)"
                strokeWidth={lineWidth}
              />
              {/* Horizontal line */}
              <line
                x1={0}
                y1={0}
                x2={patternSize}
                y2={0}
                stroke="var(--grid-lines)"
                strokeWidth={lineWidth}
              />
            </>
          )}
        </pattern>
      </defs>

      {/* Apply the grid pattern to fill the entire viewport */}
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill={`url(#${patternId})`}
      />
    </>
  );
}

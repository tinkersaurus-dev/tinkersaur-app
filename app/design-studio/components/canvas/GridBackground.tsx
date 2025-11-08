/**
 * Grid Background Component
 *
 * Renders an infinite dot grid using SVG patterns.
 * The grid uses 10px spacing with dots colored using --border-muted CSS token.
 */

interface GridBackgroundProps {
  /** Grid spacing in pixels (default: 10) */
  gridSize?: number;
}

export function GridBackground({ gridSize = 10 }: GridBackgroundProps) {
  return (
    <>
      {/* Define the grid pattern */}
      <defs>
        <pattern
          id="dot-grid"
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx={0}
            cy={0}
            r={1}
            fill="var(--border-muted)"
          />
        </pattern>
      </defs>

      {/* Apply the grid pattern to fill the entire canvas */}
      <rect
        x="-50%"
        y="-50%"
        width="200%"
        height="200%"
        fill="url(#dot-grid)"
      />
    </>
  );
}

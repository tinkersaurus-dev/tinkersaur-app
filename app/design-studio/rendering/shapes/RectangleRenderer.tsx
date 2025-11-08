import type { ShapeRendererProps } from './types';

/**
 * Rectangle Shape Renderer
 *
 * Renders a rectangle shape as an HTML div element with React.
 *
 * Features:
 * - HTML div-based rendering (not SVG)
 * - Zoom-compensated borders, text, and border radius
 * - State-based styling (selected/hovered)
 * - Inline styles for dynamic zoom compensation
 */
export function RectangleRenderer({ shape, context, onMouseDown, onMouseEnter, onMouseLeave }: ShapeRendererProps): React.ReactElement {
  const { x, y, width, height } = shape;
  const { isSelected, isHovered, zoom } = context;

  // Calculate zoom-compensated values to maintain consistent visual appearance
  let borderWidth = 2 / zoom;
  const borderRadius = 2 / zoom;
  const fontSize = 14 / zoom;
  const padding = 4 / zoom;

  // Determine border color based on state
  let borderColor = 'var(--border)';
  if (isSelected) {
    borderColor = 'var(--primary)';
    borderWidth = 3 / zoom;
  } else if (isHovered) {
    borderColor = 'var(--secondary)';
  }

  // Determine background color based on state
  let backgroundColor = 'var(--bg)';
  if (isSelected) {
    backgroundColor = 'var(--bg)';
  } else if (isHovered) {
    backgroundColor = 'var(--bg-light)';
  }

  return (
    <div
      data-shape-id={shape.id}
      onMouseDown={(e) => onMouseDown?.(e, shape.id)}
      onMouseEnter={(e) => onMouseEnter?.(e, shape.id)}
      onMouseLeave={(e) => onMouseLeave?.(e, shape.id)}
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        border: `${borderWidth}px solid ${borderColor}`,
        borderRadius: `${borderRadius}px`,
        backgroundColor,
        boxSizing: 'border-box',
        cursor: isSelected ? 'move' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${padding}px`,
      }}
    >
      {/* Render shape label if it has one */}
      {shape.label && (
        <div
          style={{
            fontSize: `${fontSize}px`,
            textAlign: 'center',
            wordWrap: 'break-word',
            overflow: 'hidden',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text)',
            pointerEvents: 'none',
          }}
        >
          {shape.label}
        </div>
      )}
    </div>
  );
}

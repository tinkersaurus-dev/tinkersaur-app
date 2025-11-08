import type { ShapeRendererProps } from './types';
import { ConnectionPointRenderer } from './ConnectionPointRenderer';
import { EditableLabel } from '../../components/canvas/EditableLabel';

/**
 * Rectangle Shape Renderer
 *
 * Renders a rectangle shape as an HTML div element with React.
 *
 * Features:
 * - HTML div-based rendering (not SVG)
 * - Zoom-compensated borders, text, and border radius
 * - State-based styling (selected/hovered)
 * - Connection points (shown on hover)
 * - Inline styles for dynamic zoom compensation
 */
export function RectangleRenderer({
  shape,
  context,
  isEditing = false,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onDoubleClick,
  onLabelChange,
  onFinishEditing,
  onConnectionPointMouseDown,
  onConnectionPointMouseUp,
}: ShapeRendererProps): React.ReactElement {
  const { x, y, width, height } = shape;
  const { isSelected, isHovered, zoom } = context;

  // Calculate zoom-compensated values to maintain consistent visual appearance
  let borderWidth = 2 / zoom;
  const borderRadius = 2 / zoom;
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
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.(shape.id);
      }}
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex: 1, // Shapes below connectors
        // Use outline instead of border to avoid box-sizing issues
        // Outline doesn't affect layout or positioning context
        outline: `${borderWidth}px solid ${borderColor}`,
        outlineOffset: `-${borderWidth}px`, // Draw outline inside the box
        borderRadius: `${borderRadius}px`,
        backgroundColor,
        cursor: isSelected ? 'move' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${padding}px`,
        boxSizing: 'border-box',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Render editable label */}
      <EditableLabel
        label={shape.label}
        isEditing={isEditing}
        zoom={zoom}
        onStartEdit={() => {}}
        onLabelChange={(newLabel) => onLabelChange?.(shape.id, 'shape', newLabel)}
        onFinishEdit={() => onFinishEditing?.()}
        fontSize={12}
        style={{
          color: 'var(--text)',
          pointerEvents: isEditing ? 'auto' : 'none',
        }}
      />

      {/* Render connection points when hovered */}
      {isHovered && onConnectionPointMouseDown && onConnectionPointMouseUp && (
        <>
          <ConnectionPointRenderer
            pointId={`${shape.id}-N`}
            direction="N"
            shapeWidth={width}
            shapeHeight={height}
            zoom={zoom}
            onMouseDown={onConnectionPointMouseDown}
            onMouseUp={onConnectionPointMouseUp}
          />
          <ConnectionPointRenderer
            pointId={`${shape.id}-S`}
            direction="S"
            shapeWidth={width}
            shapeHeight={height}
            zoom={zoom}
            onMouseDown={onConnectionPointMouseDown}
            onMouseUp={onConnectionPointMouseUp}
          />
          <ConnectionPointRenderer
            pointId={`${shape.id}-E`}
            direction="E"
            shapeWidth={width}
            shapeHeight={height}
            zoom={zoom}
            onMouseDown={onConnectionPointMouseDown}
            onMouseUp={onConnectionPointMouseUp}
          />
          <ConnectionPointRenderer
            pointId={`${shape.id}-W`}
            direction="W"
            shapeWidth={width}
            shapeHeight={height}
            zoom={zoom}
            onMouseDown={onConnectionPointMouseDown}
            onMouseUp={onConnectionPointMouseUp}
          />
        </>
      )}
    </div>
  );
}

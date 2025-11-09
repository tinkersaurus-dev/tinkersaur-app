import type { ShapeRendererProps } from './types';
import { ConnectionPointRenderer } from './ConnectionPointRenderer';
import { EditableLabel } from '../../components/canvas/EditableLabel';
import { STANDARD_RECTANGLE_CONNECTION_POINTS } from '~/design-studio/utils/connectionPoints';

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

  // Wrap connection point handlers to prepend shape ID
  const handleConnectionPointMouseDown = (connectionPointId: string, e: React.MouseEvent) => {
    onConnectionPointMouseDown?.(`${shape.id}-${connectionPointId}`, e);
  };

  const handleConnectionPointMouseUp = (connectionPointId: string, e: React.MouseEvent) => {
    onConnectionPointMouseUp?.(`${shape.id}-${connectionPointId}`, e);
  };

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
      {isHovered &&
        onConnectionPointMouseDown &&
        onConnectionPointMouseUp &&
        STANDARD_RECTANGLE_CONNECTION_POINTS.map((connectionPoint) => (
          <ConnectionPointRenderer
            key={connectionPoint.id}
            connectionPoint={connectionPoint}
            shapeWidth={width}
            shapeHeight={height}
            zoom={zoom}
            onMouseDown={handleConnectionPointMouseDown}
            onMouseUp={handleConnectionPointMouseUp}
          />
        ))}
    </div>
  );
}

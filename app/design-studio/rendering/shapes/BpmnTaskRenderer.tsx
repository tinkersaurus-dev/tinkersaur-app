/**
 * BPMN Task Renderer
 *
 * Renders BPMN task shapes as rounded rectangles with subtype-specific icons.
 * Supports subtypes: user, service, script
 */

import { FaUser, FaCog, FaCode } from 'react-icons/fa';
import type { ShapeRendererProps } from './types';
import { ConnectionPointRenderer } from './ConnectionPointRenderer';
import { EditableLabel } from '../../components/canvas/EditableLabel';
import { STANDARD_RECTANGLE_CONNECTION_POINTS } from '~/design-studio/utils/connectionPoints';

export function BpmnTaskRenderer({
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
  const { x, y, width, height, subtype } = shape;
  const { isSelected, isHovered, zoom } = context;

  // Wrap connection point handlers to prepend shape ID
  const handleConnectionPointMouseDown = (connectionPointId: string, e: React.MouseEvent) => {
    onConnectionPointMouseDown?.(`${shape.id}-${connectionPointId}`, e);
  };

  const handleConnectionPointMouseUp = (connectionPointId: string, e: React.MouseEvent) => {
    onConnectionPointMouseUp?.(`${shape.id}-${connectionPointId}`, e);
  };

  // Calculate zoom-compensated values
  let borderWidth = 2 / zoom;
  const borderRadius = 4; // More rounded for BPMN tasks
  const padding = 8;

  // Determine border color based on state
  let borderColor = 'var(--border)';
  if (isSelected) {
    borderColor = 'var(--primary)';
    borderWidth = 3 / zoom;
  } else if (isHovered) {
    borderColor = 'var(--secondary)';
  }

  // Determine background color
  let backgroundColor = 'var(--bg)';
  if (isSelected) {
    backgroundColor = 'var(--bg)';
  } else if (isHovered) {
    backgroundColor = 'var(--bg-light)';
  }

  const iconSize = 12;

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
        zIndex: 1,
        outline: `${borderWidth}px solid ${borderColor}`,
        outlineOffset: `-${borderWidth}px`,
        borderRadius: `${borderRadius}px`,
        backgroundColor,
        cursor: isSelected ? 'move' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${padding}px`,
        boxSizing: 'border-box',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Task icon in top-left corner */}
      {subtype === 'user' && (
        <div
          style={{
            position: 'absolute',
            top: `${4 / zoom}px`,
            left: `${4 / zoom}px`,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <FaUser size={iconSize} />
        </div>
      )}
      {subtype === 'service' && (
        <div
          style={{
            position: 'absolute',
            top: `${4 / zoom}px`,
            left: `${4 / zoom}px`,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <FaCog size={iconSize} />
        </div>
      )}
      {subtype === 'script' && (
        <div
          style={{
            position: 'absolute',
            top: `${4 / zoom}px`,
            left: `${4 / zoom}px`,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <FaCode size={iconSize} />
        </div>
      )}

      {/* Editable label */}
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
          textAlign: 'center',
        }}
      />

      {/* Connection points when hovered */}
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

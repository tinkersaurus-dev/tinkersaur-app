/**
 * BPMN Event Renderer
 *
 * Renders BPMN event shapes as circles with subtype-specific styling and icons.
 * Supports subtypes: start, end, catching, throwing, message-send, message-receive, timer, error
 */

import {
  FaPlay,
  FaStop,
  FaCircle,
  FaPaperPlane,
  FaEnvelope,
  FaClock,
  FaExclamationTriangle,
} from 'react-icons/fa';
import type { ShapeRendererProps } from '../../shared/rendering/types';
import { ConnectionPointRenderer } from '../../shared/rendering/ConnectionPointRenderer';
import { EditableLabel } from '@/widgets/canvas/ui/editors/EditableLabel';
import { ShapeWrapper } from '../../shared/rendering/ShapeWrapper';
import { STANDARD_RECTANGLE_CONNECTION_POINTS } from '@/widgets/canvas/lib/utils/connectionPoints';
import { useShapeInteractivity } from '@/features/diagram-rendering';

/**
 * Get icon and border style for event subtype
 */
function getEventConfig(subtype?: string) {
  const config = {
    icon: null as React.ComponentType<{ size?: number }> | null,
    borderStyle: 'single' as 'single' | 'double' | 'bold',
  };

  switch (subtype) {
    case 'start':
      config.icon = FaPlay;
      config.borderStyle = 'single';
      break;
    case 'end':
      config.icon = FaStop;
      config.borderStyle = 'bold';
      break;
    case 'catching':
    case 'throwing':
      config.icon = FaCircle;
      config.borderStyle = 'double';
      break;
    case 'message-send':
      config.icon = FaPaperPlane;
      config.borderStyle = 'single';
      break;
    case 'message-receive':
      config.icon = FaEnvelope;
      config.borderStyle = 'single';
      break;
    case 'timer':
      config.icon = FaClock;
      config.borderStyle = 'single';
      break;
    case 'error':
      config.icon = FaExclamationTriangle;
      config.borderStyle = 'single';
      break;
  }

  return config;
}

export function BpmnEventRenderer({
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
  const { width, height, subtype } = shape;
  const { zoom } = context;

  const {
    isInteractive,
    showHover,
    showSelected,
    handleConnectionPointMouseDown,
    handleConnectionPointMouseUp,
  } = useShapeInteractivity({
    shape,
    context,
    onConnectionPointMouseDown,
    onConnectionPointMouseUp,
  });

  // Events are circles, so use the smaller dimension
  const diameter = Math.min(width, height);

  // Calculate zoom-compensated values
  let borderWidth = 2 / zoom;
  const { icon: IconComponent, borderStyle } = getEventConfig(subtype);

  // Determine border color based on state
  let borderColor = 'var(--border)';
  if (showSelected) {
    borderColor = 'var(--primary)';
    borderWidth = 3 / zoom;
  } else if (showHover) {
    borderColor = 'var(--secondary)';
  }

  // Determine background color
  let backgroundColor = 'var(--bg)';
  if (showSelected) {
    backgroundColor = 'var(--bg)';
  } else if (showHover) {
    backgroundColor = 'var(--bg-light)';
  }

  const iconSize = Math.max(10, 12 / zoom);

  // Render double border for catching/throwing events
  const renderBorder = () => {
    if (borderStyle === 'double') {
      return (
        <>
          <div
            style={{
              position: 'absolute',
              inset: '0',
              borderRadius: '50%',
              outline: `${borderWidth}px solid ${borderColor}`,
              outlineOffset: `-${borderWidth}px`,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: `${borderWidth * 2}px`,
              borderRadius: '50%',
              outline: `${borderWidth}px solid ${borderColor}`,
              outlineOffset: `-${borderWidth}px`,
              pointerEvents: 'none',
            }}
          />
        </>
      );
    } else if (borderStyle === 'bold') {
      return (
        <div
          style={{
            position: 'absolute',
            inset: '0',
            borderRadius: '50%',
            outline: `${borderWidth * 2}px solid ${borderColor}`,
            outlineOffset: `-${borderWidth * 2}px`,
            pointerEvents: 'none',
          }}
        />
      );
    } else {
      // Single border
      return (
        <div
          style={{
            position: 'absolute',
            inset: '0',
            borderRadius: '50%',
            outline: `${borderWidth}px solid ${borderColor}`,
            outlineOffset: `-${borderWidth}px`,
            pointerEvents: 'none',
          }}
        />
      );
    }
  };

  return (
    <ShapeWrapper
      shape={{ ...shape, width: diameter, height: diameter }}
      isSelected={showSelected}
      isHovered={showHover}
      zoom={zoom}
      borderColor="transparent"
      borderWidth={0}
      backgroundColor={backgroundColor}
      borderRadius={0}
      hoverPadding={15}
      onMouseDown={isInteractive ? onMouseDown : undefined}
      onMouseEnter={isInteractive ? onMouseEnter : undefined}
      onMouseLeave={isInteractive ? onMouseLeave : undefined}
      onDoubleClick={isInteractive ? onDoubleClick : undefined}
      style={{
        height: `${diameter}px`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Render border(s) */}
      {renderBorder()}

      {/* Event icon */}
      {IconComponent && (
        <div
          style={{
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          <IconComponent size={iconSize} />
        </div>
      )}

      {/* Label below the event (not editable inline for events due to small size) */}
      {shape.label && !isEditing && (
        <div
          style={{
            position: 'absolute',
            top: `${diameter + 4 / zoom}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: `${10 / zoom}px`,
            color: 'var(--text)',
            width: `${diameter * 3}px`,
            wordWrap: 'break-word',
            pointerEvents: 'none',
            textAlign: 'center',
          }}
        >
          {shape.label}
        </div>
      )}

      {/* Editable label (for when editing) */}
      {isInteractive && isEditing && (
        <div
          style={{
            position: 'absolute',
            top: `${diameter + 4 / zoom}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            minWidth: `${diameter}px`,
          }}
        >
          <EditableLabel
            label={shape.label}
            isEditing={isEditing}
            onStartEdit={() => {}}
            onLabelChange={(newLabel) => onLabelChange?.(shape.id, 'shape', newLabel)}
            onFinishEdit={() => onFinishEditing?.()}
            fontSize={10}
            style={{
              color: 'var(--text)',
              pointerEvents: 'auto',
              textAlign: 'center',
            }}
          />
        </div>
      )}

      {/* Connection points when hovered */}
      {showHover &&
        onConnectionPointMouseDown &&
        onConnectionPointMouseUp &&
        STANDARD_RECTANGLE_CONNECTION_POINTS.map((connectionPoint) => (
          <ConnectionPointRenderer
            key={connectionPoint.id}
            connectionPoint={connectionPoint}
            shapeWidth={diameter}
            shapeHeight={diameter}
            onMouseDown={handleConnectionPointMouseDown}
            onMouseUp={handleConnectionPointMouseUp}
          />
        ))}
    </ShapeWrapper>
  );
}

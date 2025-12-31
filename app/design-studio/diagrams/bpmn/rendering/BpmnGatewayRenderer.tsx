/**
 * BPMN Gateway Renderer
 *
 * Renders BPMN gateway shapes as diamond (rotated square) with subtype-specific markers.
 * Supports subtypes: exclusive, inclusive, parallel
 */

import { FaTimes, FaCircle, FaPlus } from 'react-icons/fa';
import type { ShapeRendererProps } from '../../shared/rendering/types';
import { ConnectionPointRenderer } from '../../shared/rendering/ConnectionPointRenderer';
import { EditableLabel } from '~/design-studio/components/canvas/editors/EditableLabel';
import { ShapeWrapper } from '../../shared/rendering/ShapeWrapper';
import { STANDARD_RECTANGLE_CONNECTION_POINTS } from '~/design-studio/utils/connectionPoints';
import { useShapeInteractivity } from '~/design-studio/hooks';

export function BpmnGatewayRenderer({
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

  // Gateways are diamonds (squares rotated 45 degrees)
  // The width/height represent the DIAGONAL span, so we need to divide by √2
  // to get the actual square size before rotation
  const desiredDiagonal = Math.min(width, height);
  const innerSquareSize = desiredDiagonal / Math.sqrt(2);

  // Calculate offset to center the smaller rotated square within the bounding box
  const offset = (desiredDiagonal - innerSquareSize) / 2;

  // Calculate zoom-compensated values
  let borderWidth = 2 / zoom;

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

  const iconSize = Math.max(12, 16 / zoom);

  return (
    <ShapeWrapper
      shape={{ ...shape, width: desiredDiagonal, height: desiredDiagonal }}
      isSelected={showSelected}
      isHovered={showHover}
      zoom={zoom}
      borderColor="transparent"
      borderWidth={0}
      backgroundColor="transparent"
      borderRadius={0}
      hoverPadding={15}
      onMouseDown={isInteractive ? onMouseDown : undefined}
      onMouseEnter={isInteractive ? onMouseEnter : undefined}
      onMouseLeave={isInteractive ? onMouseLeave : undefined}
      onDoubleClick={isInteractive ? onDoubleClick : undefined}
      style={{
        height: `${desiredDiagonal}px`,
      }}
    >
      {/* Diamond shape (rotated square) */}
      <div
        style={{
          position: 'absolute',
          left: `${offset}px`,
          top: `${offset}px`,
          width: `${innerSquareSize}px`,
          height: `${innerSquareSize}px`,
          backgroundColor,
          transform: 'rotate(45deg)',
          transformOrigin: 'center',
          outline: `${borderWidth}px solid ${borderColor}`,
          outlineOffset: `-${borderWidth}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Marker icon (counter-rotated to appear upright) */}
        {subtype === 'exclusive' && (
          <div
            style={{
              transform: 'rotate(-45deg)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <FaTimes size={iconSize} />
          </div>
        )}
        {subtype === 'inclusive' && (
          <div
            style={{
              transform: 'rotate(-45deg)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <FaCircle size={iconSize} />
          </div>
        )}
        {subtype === 'parallel' && (
          <div
            style={{
              transform: 'rotate(-45deg)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <FaPlus size={iconSize} />
          </div>
        )}
      </div>

      {/* Label below the gateway (not editable inline due to rotated shape complexity) */}
      {shape.label && !(isInteractive && isEditing) && (
        <div
          style={{
            position: 'absolute',
            top: `${desiredDiagonal + 4 / zoom}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: `${10 / zoom}px`,
            color: 'var(--text)',
            width: `${desiredDiagonal * 3}px`,
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
            top: `${desiredDiagonal + 4 / zoom}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            minWidth: `${desiredDiagonal}px`,
          }}
        >
          <EditableLabel
            label={shape.label}
            isEditing={isInteractive && isEditing}
            onStartEdit={() => {}}
            onLabelChange={(newLabel) => onLabelChange?.(shape.id, 'shape', newLabel)}
            onFinishEdit={() => onFinishEditing?.()}
            fontSize={10}
            style={{
              color: 'var(--text)',
              pointerEvents: isInteractive && isEditing ? 'auto' : 'none',
              textAlign: 'center',
            }}
          />
        </div>
      )}

      {/* Connection points when hovered (placed at actual N/S/E/W of the bounding box) */}
      {showHover &&
        onConnectionPointMouseDown &&
        onConnectionPointMouseUp &&
        STANDARD_RECTANGLE_CONNECTION_POINTS.map((connectionPoint) => (
          <ConnectionPointRenderer
            key={connectionPoint.id}
            connectionPoint={connectionPoint}
            shapeWidth={desiredDiagonal}
            shapeHeight={desiredDiagonal}
            onMouseDown={handleConnectionPointMouseDown}
            onMouseUp={handleConnectionPointMouseUp}
          />
        ))}
    </ShapeWrapper>
  );
}

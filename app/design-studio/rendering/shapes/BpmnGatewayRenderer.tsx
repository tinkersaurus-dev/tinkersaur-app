/**
 * BPMN Gateway Renderer
 *
 * Renders BPMN gateway shapes as diamond (rotated square) with subtype-specific markers.
 * Supports subtypes: exclusive, inclusive, parallel
 */

import { FaTimes, FaCircle, FaPlus } from 'react-icons/fa';
import type { ShapeRendererProps } from './types';
import { ConnectionPointRenderer } from './ConnectionPointRenderer';
import { EditableLabel } from '../../components/canvas/EditableLabel';

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
  const { x, y, width, height, subtype } = shape;
  const { isSelected, isHovered, zoom } = context;

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

  const iconSize = Math.max(12, 16 / zoom);

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
        width: `${desiredDiagonal}px`,
        height: `${desiredDiagonal}px`,
        zIndex: 1,
        cursor: isSelected ? 'move' : 'pointer',
        userSelect: 'none',
        WebkitUserSelect: 'none',
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
      {shape.label && !isEditing && (
        <div
          style={{
            position: 'absolute',
            top: `${desiredDiagonal + 4 / zoom}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: `${10 / zoom}px`,
            color: 'var(--text)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            textAlign: 'center',
          }}
        >
          {shape.label}
        </div>
      )}

      {/* Editable label (for when editing) */}
      {isEditing && (
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
            isEditing={isEditing}
            onStartEdit={() => {}}
            onLabelChange={(newLabel) => onLabelChange?.(shape.id, 'shape', newLabel)}
            onFinishEdit={() => onFinishEditing?.()}
            fontSize={10}
            style={{
              color: 'var(--text)',
              pointerEvents: isEditing ? 'auto' : 'none',
              textAlign: 'center',
            }}
          />
        </div>
      )}

      {/* Connection points when hovered (placed at actual N/S/E/W of the bounding box) */}
      {isHovered && onConnectionPointMouseDown && onConnectionPointMouseUp && (
        <>
          <ConnectionPointRenderer
            pointId={`${shape.id}-N`}
            direction="N"
            shapeWidth={desiredDiagonal}
            shapeHeight={desiredDiagonal}
            zoom={zoom}
            onMouseDown={onConnectionPointMouseDown}
            onMouseUp={onConnectionPointMouseUp}
          />
          <ConnectionPointRenderer
            pointId={`${shape.id}-S`}
            direction="S"
            shapeWidth={desiredDiagonal}
            shapeHeight={desiredDiagonal}
            zoom={zoom}
            onMouseDown={onConnectionPointMouseDown}
            onMouseUp={onConnectionPointMouseUp}
          />
          <ConnectionPointRenderer
            pointId={`${shape.id}-E`}
            direction="E"
            shapeWidth={desiredDiagonal}
            shapeHeight={desiredDiagonal}
            zoom={zoom}
            onMouseDown={onConnectionPointMouseDown}
            onMouseUp={onConnectionPointMouseUp}
          />
          <ConnectionPointRenderer
            pointId={`${shape.id}-W`}
            direction="W"
            shapeWidth={desiredDiagonal}
            shapeHeight={desiredDiagonal}
            zoom={zoom}
            onMouseDown={onConnectionPointMouseDown}
            onMouseUp={onConnectionPointMouseUp}
          />
        </>
      )}
    </div>
  );
}

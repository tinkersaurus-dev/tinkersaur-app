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
import { ShapeWrapper } from './ShapeWrapper';
import { STANDARD_RECTANGLE_CONNECTION_POINTS } from '~/design-studio/utils/connectionPoints';

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
  const { isSelected, isHovered, zoom } = context;

  // Wrap connection point handlers to prepend shape ID
  const handleConnectionPointMouseDown = (connectionPointId: string, e: React.MouseEvent) => {
    onConnectionPointMouseDown?.(`${shape.id}-${connectionPointId}`, e);
  };

  const handleConnectionPointMouseUp = (connectionPointId: string, e: React.MouseEvent) => {
    onConnectionPointMouseUp?.(`${shape.id}-${connectionPointId}`, e);
  };

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
    <ShapeWrapper
      shape={{ ...shape, width: desiredDiagonal, height: desiredDiagonal }}
      isSelected={isSelected}
      isHovered={isHovered}
      zoom={zoom}
      borderColor="transparent"
      borderWidth={0}
      backgroundColor="transparent"
      borderRadius={0}
      hoverPadding={15}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDoubleClick={onDoubleClick}
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
      {isHovered &&
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

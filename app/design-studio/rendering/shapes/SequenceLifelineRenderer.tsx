/**
 * Sequence Lifeline Renderer
 *
 * Renders sequence diagram lifeline shapes with:
 * - Participant box at the top (various subtypes: actor, object, database, etc.)
 * - Vertical dashed lifeline extending downward
 * - Auto-generated activation boxes based on message flow
 */

import { FaUser, FaDatabase, FaSquare, FaBorderAll, FaServer } from 'react-icons/fa';
import type { ShapeRendererProps } from './types';
import type { SequenceLifelineData } from '~/core/entities/design-studio/types/Shape';
import { ConnectionPointRenderer } from './ConnectionPointRenderer';
import { EditableLabel } from '../../components/canvas/editors/EditableLabel';
import { ShapeWrapper } from './ShapeWrapper';
import { generateSequenceLifelineConnectionPoints } from '~/design-studio/utils/connectionPoints';

const PARTICIPANT_BOX_HEIGHT = 40; // Fixed height for the participant box at the top

export function SequenceLifelineRenderer({
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

  // Disable interactivity for preview shapes
  const isInteractive = !shape.isPreview;
  const showHover = isInteractive && isHovered;
  const showSelected = isInteractive && isSelected;

  // Wrap connection point handlers to prepend shape ID
  const handleConnectionPointMouseDown = (connectionPointId: string, e: React.MouseEvent) => {
    onConnectionPointMouseDown?.(`${shape.id}-${connectionPointId}`, e);
  };

  const handleConnectionPointMouseUp = (connectionPointId: string, e: React.MouseEvent) => {
    onConnectionPointMouseUp?.(`${shape.id}-${connectionPointId}`, e);
  };

  // Wrap mouse handlers
  const handleMouseDown = (e: React.MouseEvent, shapeId: string) => {
    onMouseDown?.(e, shapeId);
  };

  const handleMouseEnter = (e: React.MouseEvent, shapeId: string) => {
    onMouseEnter?.(e, shapeId);
  };

  const handleMouseLeave = (e: React.MouseEvent, shapeId: string) => {
    onMouseLeave?.(e, shapeId);
  };

  const handleDoubleClick = (shapeId: string) => {
    onDoubleClick?.(shapeId);
  };

  // Parse lifeline data with defaults
  const lifelineData = shape.data as SequenceLifelineData | undefined;
  const lifelineStyle = lifelineData?.lifelineStyle || 'dashed';
  const activations = lifelineData?.activations || [];
  const isDestroyed = lifelineData?.isDestroyed || false;
  const destroyedAtY = lifelineData?.destroyedAtY;

  // Calculate zoom-compensated values
  let borderWidth = 2 / zoom;
  const borderRadius = 2;
  const padding = 8;

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

  const iconSize = 16;
  const lifelineX = width / 2; // Center of the lifeline
  const lifelineStartY = PARTICIPANT_BOX_HEIGHT; // Start below participant box
  const lifelineEndY = height; // Extend to shape height

  // Activation box width
  const activationWidth = 12;

  return (
    <>
      {/* Participant box (clickable area) - using ShapeWrapper for proper event handling */}
      <ShapeWrapper
        shape={{ ...shape, height: PARTICIPANT_BOX_HEIGHT }}
        isSelected={showSelected}
        isHovered={showHover}
        zoom={zoom}
        borderColor={borderColor}
        borderWidth={borderWidth}
        backgroundColor={backgroundColor}
        borderRadius={borderRadius}
        onMouseDown={isInteractive ? handleMouseDown : undefined}
        onMouseEnter={isInteractive ? handleMouseEnter : undefined}
        onMouseLeave={isInteractive ? handleMouseLeave : undefined}
        onDoubleClick={isInteractive ? handleDoubleClick : undefined}
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: `${padding}px`,
          height: `${PARTICIPANT_BOX_HEIGHT}px`,
        }}
      >
        {/* Icons - hidden when editing */}
        {!isEditing && subtype === 'actor' && (
          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <FaUser size={iconSize} />
          </div>
        )}
        {!isEditing && subtype === 'database' && (
          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <FaDatabase size={iconSize} />
          </div>
        )}
        {!isEditing && subtype === 'object' && (
          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <FaSquare size={iconSize} />
          </div>
        )}
        {!isEditing && subtype === 'boundary' && (
          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <FaBorderAll size={iconSize} />
          </div>
        )}
        {!isEditing && subtype === 'control' && (
          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <FaServer size={iconSize} />
          </div>
        )}
        {!isEditing && subtype === 'entity' && (
          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <FaDatabase size={iconSize} />
          </div>
        )}

        {/* Editable label */}
        <EditableLabel
          label={shape.label || 'Participant'}
          isEditing={isInteractive && isEditing}
          onStartEdit={() => {}}
          onLabelChange={(newLabel) => onLabelChange?.(shape.id, 'shape', newLabel)}
          onFinishEdit={() => onFinishEditing?.()}
          fontSize={11}
          style={{
            color: 'var(--text)',
            pointerEvents: isInteractive && isEditing ? 'auto' : 'none',
            textAlign: 'center',
          }}
        />
      </ShapeWrapper>

      {/* Invisible hover area for the lifeline */}
      <div
        style={{
          position: 'absolute',
          left: `${x}px`,
          top: `${y + PARTICIPANT_BOX_HEIGHT}px`,
          width: `${width}px`,
          height: `${height - PARTICIPANT_BOX_HEIGHT}px`,
          pointerEvents: 'auto',
          zIndex: 1,
        }}
        onMouseEnter={(e) => onMouseEnter?.(e, shape.id)}
        onMouseLeave={(e) => onMouseLeave?.(e, shape.id)}
      />

      {/* Vertical lifeline */}
      <svg
        style={{
          position: 'absolute',
          left: `${x}px`,
          top: `${y}px`,
          width: `${width}px`,
          height: `${height}px`,
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
     

        {/* Dashed vertical line */}
        <line
          x1={lifelineX}
          y1={lifelineStartY}
          x2={lifelineX}
          y2={isDestroyed && destroyedAtY ? destroyedAtY : lifelineEndY}
          stroke="var(--border)"
          strokeWidth={1 / zoom}
          strokeDasharray={lifelineStyle === 'dashed' ? '4 4' : undefined}
          pointerEvents="none"
        />

        {/* Destruction mark (X) if destroyed */}
        {isDestroyed && destroyedAtY && (
          <g>
            <line
              x1={lifelineX - 8}
              y1={destroyedAtY - 8}
              x2={lifelineX + 8}
              y2={destroyedAtY + 8}
              stroke="var(--error)"
              strokeWidth={2 / zoom}
            />
            <line
              x1={lifelineX + 8}
              y1={destroyedAtY - 8}
              x2={lifelineX - 8}
              y2={destroyedAtY + 8}
              stroke="var(--error)"
              strokeWidth={2 / zoom}
            />
          </g>
        )}
      </svg>

      {/* Activation boxes */}
      {activations.map((activation, index) => {
        const activationX = x + lifelineX - activationWidth / 2 + activation.depth * (activationWidth / 2);
        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${activationX}px`,
              top: `${y + activation.startY}px`,
              width: `${activationWidth}px`,
              height: `${activation.endY - activation.startY}px`,
              backgroundColor: 'var(--bg)',
              border: `${1 / zoom}px solid var(--border)`,
              pointerEvents: 'none',
            }}
          />
        );
      })}

      {/* Connection points along lifeline when hovered */}
      {showHover &&
        onConnectionPointMouseDown &&
        onConnectionPointMouseUp &&
        generateSequenceLifelineConnectionPoints(height)
          .filter((cp) => cp.id !== 'n' && cp.id !== 's')
          .map((connectionPoint) => (
            <div
              key={connectionPoint.id}
              style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                width: `${width}px`,
                height: `${height}px`,
                pointerEvents: 'none',
              }}
            >
              <ConnectionPointRenderer
                connectionPoint={connectionPoint}
                shapeWidth={width}
                shapeHeight={height}
                onMouseDown={handleConnectionPointMouseDown}
                onMouseUp={handleConnectionPointMouseUp}
                onMouseEnter={(e) => onMouseEnter?.(e, shape.id)}
                onMouseLeave={(e) => onMouseLeave?.(e, shape.id)}
              />
            </div>
          ))}
    </>
  );
}

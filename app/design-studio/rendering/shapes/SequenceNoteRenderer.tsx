/**
 * Sequence Note Renderer
 *
 * Renders note/comment shapes for sequence diagrams.
 * Notes are used for documentation and annotations.
 */

import { FaStickyNote } from 'react-icons/fa';
import type { ShapeRendererProps } from './types';
import { ConnectionPointRenderer } from './ConnectionPointRenderer';
import { EditableLabel } from '../../components/canvas/editors/EditableLabel';
import { ShapeWrapper } from './ShapeWrapper';
import { STANDARD_RECTANGLE_CONNECTION_POINTS } from '~/design-studio/utils/connectionPoints';

export function SequenceNoteRenderer({
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
  const { width, height } = shape;
  const { isSelected, isHovered, zoom } = context;

  // Wrap connection point handlers to prepend shape ID
  const handleConnectionPointMouseDown = (connectionPointId: string, e: React.MouseEvent) => {
    onConnectionPointMouseDown?.(`${shape.id}-${connectionPointId}`, e);
  };

  const handleConnectionPointMouseUp = (connectionPointId: string, e: React.MouseEvent) => {
    onConnectionPointMouseUp?.(`${shape.id}-${connectionPointId}`, e);
  };

  // Calculate zoom-compensated values
  let borderWidth = 1 / zoom; // Thinner border for notes
  const borderRadius = 2;
  const padding = 8;

  // Determine border color based on state
  let borderColor = 'var(--border)';
  if (isSelected) {
    borderColor = 'var(--primary)';
    borderWidth = 2 / zoom;
  } else if (isHovered) {
    borderColor = 'var(--secondary)';
  }

  // Note-specific background color (slightly different tint)
  let backgroundColor = 'var(--warning-light)'; // Light yellow/note color
  if (isSelected) {
    backgroundColor = 'var(--warning-light)';
  } else if (isHovered) {
    backgroundColor = 'var(--warning-lighter)';
  }

  const iconSize = 10;

  return (
    <ShapeWrapper
      shape={shape}
      isSelected={isSelected}
      isHovered={isHovered}
      zoom={zoom}
      borderColor={borderColor}
      borderWidth={borderWidth}
      backgroundColor={backgroundColor}
      borderRadius={borderRadius}
      hoverPadding={15}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDoubleClick={onDoubleClick}
      style={{
        height: `${height}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        padding: `${padding}px`,
        borderStyle: 'dashed', // Dashed border for notes
      }}
    >
      {/* Note icon in top-left corner */}
      <div
        style={{
          position: 'absolute',
          top: `${4 / zoom}px`,
          right: `${4 / zoom}px`,
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <FaStickyNote size={iconSize} />
      </div>

      {/* Editable label */}
      <EditableLabel
        label={shape.label || 'Note'}
        isEditing={isEditing}
        onStartEdit={() => {}}
        onLabelChange={(newLabel) => onLabelChange?.(shape.id, 'shape', newLabel)}
        onFinishEdit={() => onFinishEditing?.()}
        fontSize={11}
        style={{
          color: 'var(--text)',
          pointerEvents: isEditing ? 'auto' : 'none',
          textAlign: 'left',
          width: '100%',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
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
            onMouseDown={handleConnectionPointMouseDown}
            onMouseUp={handleConnectionPointMouseUp}
          />
        ))}
    </ShapeWrapper>
  );
}

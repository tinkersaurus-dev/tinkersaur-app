/**
 * Sequence Note Renderer
 *
 * Renders note/comment shapes for sequence diagrams.
 * Notes are used for documentation and annotations.
 */

import { FaStickyNote } from 'react-icons/fa';
import type { ShapeRendererProps } from '../../shared/rendering/types';
import { ConnectionPointRenderer } from '../../shared/rendering/ConnectionPointRenderer';
import { EditableLabel } from '@/widgets/canvas/ui/editors/EditableLabel';
import { ShapeWrapper } from '../../shared/rendering/ShapeWrapper';
import { STANDARD_RECTANGLE_CONNECTION_POINTS } from '~/design-studio/utils/connectionPoints';
import { useShapeInteractivity } from '@/features/diagram-rendering';

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

  // Calculate zoom-compensated values
  let borderWidth = 1 / zoom; // Thinner border for notes
  const borderRadius = 2;
  const padding = 8;

  // Determine border color based on state
  let borderColor = 'var(--border)';
  if (showSelected) {
    borderColor = 'var(--primary)';
    borderWidth = 2 / zoom;
  } else if (showHover) {
    borderColor = 'var(--secondary)';
  }

  // Note-specific background color (slightly different tint)
  let backgroundColor = 'var(--warning-light)'; // Light yellow/note color
  if (showSelected) {
    backgroundColor = 'var(--warning-light)';
  } else if (showHover) {
    backgroundColor = 'var(--warning-lighter)';
  }

  const iconSize = 10;

  return (
    <ShapeWrapper
      shape={shape}
      isSelected={showSelected}
      isHovered={showHover}
      zoom={zoom}
      borderColor={borderColor}
      borderWidth={borderWidth}
      backgroundColor={backgroundColor}
      borderRadius={borderRadius}
      hoverPadding={15}
      onMouseDown={isInteractive ? onMouseDown : undefined}
      onMouseEnter={isInteractive ? onMouseEnter : undefined}
      onMouseLeave={isInteractive ? onMouseLeave : undefined}
      onDoubleClick={isInteractive ? onDoubleClick : undefined}
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
        isEditing={isInteractive && isEditing}
        onStartEdit={() => {}}
        onLabelChange={(newLabel) => onLabelChange?.(shape.id, 'shape', newLabel)}
        onFinishEdit={() => onFinishEditing?.()}
        fontSize={11}
        style={{
          color: 'var(--text)',
          pointerEvents: isInteractive && isEditing ? 'auto' : 'none',
          textAlign: 'left',
          width: '100%',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      />

      {/* Connection points when hovered */}
      {showHover &&
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

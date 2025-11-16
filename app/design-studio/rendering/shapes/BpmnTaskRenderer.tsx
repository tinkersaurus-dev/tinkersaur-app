/**
 * BPMN Task Renderer
 *
 * Renders BPMN task shapes as rounded rectangles with subtype-specific icons.
 * Supports subtypes: user, service, script
 */

import { LuSquareUserRound, LuSettings, LuSquareCode } from "react-icons/lu";
import type { ShapeRendererProps } from './types';
import { ConnectionPointRenderer } from './ConnectionPointRenderer';
import { EditableLabel } from '../../components/canvas/editors/EditableLabel';
import { ShapeWrapper } from './ShapeWrapper';
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
  const { width, height, subtype } = shape;
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

  // Calculate zoom-compensated values
  let borderWidth = 2 / zoom;
  const borderRadius = 4; // More rounded for BPMN tasks
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

  const iconSize = 14;

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
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${padding}px`,
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
          <LuSquareUserRound size={iconSize}/>
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
          <LuSettings size={iconSize} />
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
          <LuSquareCode size={iconSize} />
        </div>
      )}

      {/* Editable label */}
      <EditableLabel
        label={shape.label}
        isEditing={isInteractive && isEditing}
        onStartEdit={() => {}}
        onLabelChange={(newLabel) => onLabelChange?.(shape.id, 'shape', newLabel)}
        onFinishEdit={() => onFinishEditing?.()}
        fontSize={12}
        style={{
          color: 'var(--text)',
          pointerEvents: (isInteractive && isEditing) ? 'auto' : 'none',
          textAlign: 'center',
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

/**
 * Architecture Group Renderer
 *
 * Renders architectural group/container shapes as larger rectangles with rounded corners.
 * Groups can contain services and can be nested within other groups.
 * Supports icons and labels in the header area.
 */

import { LuCloud, LuDatabase, LuServer, LuHardDrive, LuGlobe, LuBox, LuMonitor, LuSmartphone, LuCode, LuTvMinimal, LuTablet } from "react-icons/lu";
import type { ShapeRendererProps } from '../../shared/rendering/types';
import { ConnectionPointRenderer } from '../../shared/rendering/ConnectionPointRenderer';
import { EditableLabel } from '~/design-studio/components/canvas/editors/EditableLabel';
import { ShapeWrapper } from '../../shared/rendering/ShapeWrapper';
import { STANDARD_RECTANGLE_CONNECTION_POINTS } from '~/design-studio/utils/connectionPoints';

export function ArchitectureGroupRenderer({
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
  const { isSelected, isHovered, isHoveredContainer, zoom } = context;

  // Get icon from shape data
  const icon = (shape.data as Record<string, unknown>)?.icon || 'box';

  // Disable interactivity for preview shapes
  const isInteractive = !shape.isPreview;
  const showHover = isInteractive && isHovered;
  const showSelected = isInteractive && isSelected;
  const showHoveredContainer = isInteractive && isHoveredContainer;

  // Wrap connection point handlers to prepend shape ID
  const handleConnectionPointMouseDown = (connectionPointId: string, e: React.MouseEvent) => {
    onConnectionPointMouseDown?.(`${shape.id}-${connectionPointId}`, e);
  };

  const handleConnectionPointMouseUp = (connectionPointId: string, e: React.MouseEvent) => {
    onConnectionPointMouseUp?.(`${shape.id}-${connectionPointId}`, e);
  };

  // Calculate zoom-compensated values
  let borderWidth = 2 / zoom;
  const borderRadius = 8; // More rounded for groups
  const headerHeight = 40;
  const padding = 12;

  // Determine border color based on state
  let borderColor = 'var(--border)';
  if (showSelected) {
    borderColor = 'var(--primary)';
    borderWidth = 3 / zoom;
  } else if (showHoveredContainer) {
    // Visual feedback during drag - highlighted container
    borderColor = 'var(--success)';
    borderWidth = 3 / zoom;
  } else if (showHover) {
    borderColor = 'var(--secondary)';
  }

  // Determine background color - lighter for groups to show containment
  let backgroundColor = 'var(--bg-subtle)';
  if (showSelected) {
    backgroundColor = 'var(--bg-subtle)';
  } else if (showHoveredContainer) {
    // Visual feedback during drag - highlighted container background
    backgroundColor = 'var(--bg-success-subtle)';
  } else if (showHover) {
    backgroundColor = 'var(--bg-light)';
  }

  const iconSize = 18;

  // Icon component mapping
  type IconType = 'cloud' | 'database' | 'server' | 'disk' | 'internet' | 'box' | 'web' | 'mobile' | 'react' | 'frontend' | 'tablet';
  const iconMapping: Record<IconType, typeof LuBox> = {
    cloud: LuCloud,
    database: LuDatabase,
    server: LuServer,
    disk: LuHardDrive,
    internet: LuGlobe,
    box: LuBox,
    web: LuMonitor,
    mobile: LuSmartphone,
    react: LuCode,
    frontend: LuTvMinimal,
    tablet: LuTablet,
  };
  const IconComponent = (icon && iconMapping[icon as IconType]) || LuBox;

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
        overflow: 'visible',
      }}
    >
      {/* Header section with icon and label */}
      <div
        style={{
          height: `${headerHeight}px`,
          display: 'flex',
          alignItems: 'center',
          gap: `${8 / zoom}px`,
          padding: `${padding}px`,
          borderBottom: `${1 / zoom}px solid var(--border-light)`,
        }}
      >
        {/* Group icon */}
        <div
          style={{
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            flexShrink: 0,
          }}
        >
          <IconComponent size={iconSize} />
        </div>

        {/* Editable label */}
        <EditableLabel
          label={shape.label}
          isEditing={isInteractive && isEditing}
          onStartEdit={() => {}}
          onLabelChange={(newLabel) => onLabelChange?.(shape.id, 'shape', newLabel)}
          onFinishEdit={() => onFinishEditing?.()}
          fontSize={13}
          style={{
            color: 'var(--text)',
            pointerEvents: (isInteractive && isEditing) ? 'auto' : 'none',
            textAlign: 'left',
            flex: 1,
            fontWeight: 600,
          }}
        />
      </div>

      {/* Content area - transparent for nested elements to show through */}
      <div
        style={{
          flex: 1,
          padding: `${padding}px`,
          pointerEvents: 'none', // Allow click-through to nested shapes
        }}
      />

      {/* Connection points when hovered - on group boundaries */}
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

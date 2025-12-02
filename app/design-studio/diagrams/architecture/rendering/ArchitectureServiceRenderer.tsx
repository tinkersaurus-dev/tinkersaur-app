/**
 * Architecture Service Renderer
 *
 * Renders architectural service shapes as rectangles with icons and labels.
 * Supports icons: cloud, database, server, disk, internet, web, mobile, react, frontend, tablet, and custom iconify icons.
 */

import { LuCloud, LuDatabase, LuServer, LuHardDrive, LuGlobe, LuMonitor, LuSmartphone, LuCode, LuTvMinimal, LuTablet } from "react-icons/lu";
import type { ShapeRendererProps } from '../../shared/rendering/types';
import { ConnectionPointRenderer } from '../../shared/rendering/ConnectionPointRenderer';
import { EditableLabel } from '~/design-studio/components/canvas/editors/EditableLabel';
import { ShapeWrapper } from '../../shared/rendering/ShapeWrapper';
import { STANDARD_RECTANGLE_CONNECTION_POINTS } from '~/design-studio/utils/connectionPoints';

export function ArchitectureServiceRenderer({
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

  // Get icon from shape data
  const icon = (shape.data as Record<string, unknown>)?.icon || 'server';

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

  const iconSize = 24;

  // Icon component mapping
  type IconType = 'cloud' | 'database' | 'server' | 'disk' | 'internet' | 'web' | 'mobile' | 'react' | 'frontend' | 'tablet';
  const iconMapping: Record<IconType, typeof LuServer> = {
    cloud: LuCloud,
    database: LuDatabase,
    server: LuServer,
    disk: LuHardDrive,
    internet: LuGlobe,
    web: LuMonitor,
    mobile: LuSmartphone,
    react: LuCode,
    frontend: LuTvMinimal,
    tablet: LuTablet,
  };
  const IconComponent = (icon && iconMapping[icon as IconType]) || LuServer;

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
        gap: `${4 / zoom}px`,
      }}
    >
      {/* Service icon centered at top */}
      <div
        style={{
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
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
        fontSize={11}
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

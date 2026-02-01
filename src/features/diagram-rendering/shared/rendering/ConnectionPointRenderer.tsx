import React from 'react';
import type { ConnectionPoint } from '@/widgets/canvas/lib/utils/connectionPoints';
import { calculateAbsolutePosition } from '@/widgets/canvas/lib/utils/connectionPoints';
import { DESIGN_STUDIO_CONFIG } from '@/shared/config/design-studio';
import { THEME_CONFIG } from '@/shared/lib/config/theme-config';

/**
 * ConnectionPointRenderer
 *
 * Renders connection points on shapes for creating connectors.
 * Connection points appear as small blue circles at configured positions on shapes.
 * Only visible when shape is hovered or when drawing a connector from this shape.
 */

interface ConnectionPointRendererProps {
  /** Connection point configuration with position and direction */
  connectionPoint: ConnectionPoint;

  /** Shape dimensions (needed to calculate absolute position) */
  shapeWidth: number;
  shapeHeight: number;

  /** Mouse down handler (starts connector drawing) */
  onMouseDown?: (connectionPointId: string, e: React.MouseEvent) => void;

  /** Mouse up handler (completes connector drawing) */
  onMouseUp?: (connectionPointId: string, e: React.MouseEvent) => void;

  /** Mouse enter handler (to maintain hover state) */
  onMouseEnter?: (e: React.MouseEvent) => void;

  /** Mouse leave handler (to maintain hover state) */
  onMouseLeave?: (e: React.MouseEvent) => void;
}

export const ConnectionPointRenderer: React.FC<ConnectionPointRendererProps> = ({
  connectionPoint,
  shapeWidth,
  shapeHeight,
  onMouseDown,
  onMouseUp,
  onMouseEnter,
  onMouseLeave,
}) => {
  // Calculate position relative to the shape (parent container)
  // Uses calculateAbsolutePosition to handle both percentage and fixed offset positioning
  const absolutePos = calculateAbsolutePosition(connectionPoint, {
    x: 0,
    y: 0,
    width: shapeWidth,
    height: shapeHeight,
  });

  const pos = {
    x: absolutePos.x,
    y: absolutePos.y,
  };

  const size = DESIGN_STUDIO_CONFIG.connectionPoint.visualSize;
  const borderWidth = 3.5; // 2px border compensated for zoom

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMouseDown?.(connectionPoint.id, e);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMouseUp?.(connectionPoint.id, e);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'absolute',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: 'var(--canvas-connection-point-fill)',
        border: `${borderWidth}px solid var(--canvas-connection-point-border)`,
        transform: 'translate(-50%, -50%)',
        cursor: 'crosshair',
        zIndex: THEME_CONFIG.zIndex.connectionPoints,
        boxSizing: 'border-box',
        pointerEvents: 'auto',
      }}
    />
  );
};

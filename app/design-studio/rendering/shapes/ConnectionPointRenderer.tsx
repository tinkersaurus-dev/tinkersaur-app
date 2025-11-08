import React from 'react';
import type { ConnectionPointDirection } from '~/core/entities/design-studio/types/Connector';

/**
 * ConnectionPointRenderer
 *
 * Renders connection points on shapes for creating connectors.
 * Connection points appear as small blue circles at N/S/E/W positions on shapes.
 * Only visible when shape is hovered or when drawing a connector from this shape.
 */

interface ConnectionPointRendererProps {
  /** Unique ID for this connection point (format: "{shapeId}-{direction}") */
  pointId: string;

  /** Direction of the connection point */
  direction: ConnectionPointDirection;

  /** Shape dimensions (needed to calculate position) */
  shapeWidth: number;
  shapeHeight: number;

  /** Current zoom level (for size compensation) */
  zoom: number;

  /** Mouse down handler (starts connector drawing) */
  onMouseDown?: (pointId: string, direction: ConnectionPointDirection, e: React.MouseEvent) => void;

  /** Mouse up handler (completes connector drawing) */
  onMouseUp?: (pointId: string, direction: ConnectionPointDirection, e: React.MouseEvent) => void;
}

export const ConnectionPointRenderer: React.FC<ConnectionPointRendererProps> = ({
  pointId,
  direction,
  shapeWidth,
  shapeHeight,
  zoom,
  onMouseDown,
  onMouseUp,
}) => {
  // Calculate position relative to the shape (parent container)
  // With box-sizing: border-box, the positioning context is the padding edge
  // So left: 0 is at the inner edge of the left border, not the outer edge
  const getPosition = (): { x: number; y: number } => {
    switch (direction) {
      case 'N':
        return { x: shapeWidth / 2, y: 0 };
      case 'S':
        return { x: shapeWidth / 2, y: shapeHeight };
      case 'E':
        return { x: shapeWidth, y: shapeHeight / 2 };
      case 'W':
        return { x: 0, y: shapeHeight / 2 };
    }
  };

  const pos = getPosition();
  const size = 8 / zoom; // 8px diameter compensated for zoom
  const borderWidth = 2 / zoom; // 2px border compensated for zoom

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMouseDown?.(pointId, direction, e);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMouseUp?.(pointId, direction, e);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
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
        zIndex: 10,
        boxSizing: 'border-box',
        pointerEvents: 'auto',
      }}
    />
  );
};

import type { Shape } from '~/core/entities/design-studio/types';
import type { DrawingConnector } from '../../hooks/useConnectorDrawing';

interface ConnectorDrawingPreviewProps {
  drawingConnector: DrawingConnector;
  shapes: Shape[];
  zoom: number;
}

/**
 * Preview line shown while drawing a new connector
 */
export function ConnectorDrawingPreview({ drawingConnector, shapes, zoom }: ConnectorDrawingPreviewProps) {
  const fromShape = shapes.find((s) => s.id === drawingConnector.fromShapeId);
  if (!fromShape) return null;

  // Calculate start position from shape and direction
  let startX = fromShape.x;
  let startY = fromShape.y;
  switch (drawingConnector.fromDirection) {
    case 'N':
      startX += fromShape.width / 2;
      startY += 0;
      break;
    case 'S':
      startX += fromShape.width / 2;
      startY += fromShape.height;
      break;
    case 'E':
      startX += fromShape.width;
      startY += fromShape.height / 2;
      break;
    case 'W':
      startX += 0;
      startY += fromShape.height / 2;
      break;
  }

  const strokeWidth = 2 / zoom;

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      <line
        x1={startX}
        y1={startY}
        x2={drawingConnector.currentX}
        y2={drawingConnector.currentY}
        stroke="var(--canvas-preview-stroke)"
        strokeWidth={strokeWidth}
        strokeDasharray={`${strokeWidth * 4} ${strokeWidth * 2}`}
        pointerEvents="none"
      />
    </svg>
  );
}

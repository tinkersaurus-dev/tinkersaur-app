import type { Shape } from '~/core/entities/design-studio/types';
import type { ViewportTransform } from '../../utils/viewport';
import type { DrawingConnector } from '../../hooks/useInteractionState';
import { getConnectionPointsForShape, calculateAbsolutePosition } from '../../utils/connectionPoints';

interface ConnectorDrawingPreviewProps {
  drawingConnector: DrawingConnector;
  shapes: Shape[];
  viewportTransform: ViewportTransform;
}

/**
 * Preview line shown while drawing a new connector
 */
export function ConnectorDrawingPreview({ drawingConnector, shapes, viewportTransform }: ConnectorDrawingPreviewProps) {
  const fromShape = shapes.find((s) => s.id === drawingConnector.fromShapeId);
  if (!fromShape) return null;

  // Get connection points for the shape
  const connectionPoints = getConnectionPointsForShape(fromShape.type);

  // Parse the connection point ID from the full ID (format: "{shapeId}-{connectionPointId}")
  const parts = drawingConnector.fromConnectionPointId.split('-');
  const connectionPointId = parts[parts.length - 1];

  // Find the connection point
  const connectionPoint = connectionPoints.find((cp) => cp.id === connectionPointId);
  if (!connectionPoint) return null;

  // Calculate the absolute position
  const startPos = calculateAbsolutePosition(connectionPoint, fromShape);
  const startX = startPos.x;
  const startY = startPos.y;

  const strokeWidth = 2 / viewportTransform.viewport.zoom;

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

import type { Shape } from '~/core/entities/design-studio/types';
import type { ViewportTransform } from '../../../utils/viewport';
import type { DrawingConnector } from '../../../hooks/useInteractionState';
import { getConnectionPointsForShape, calculateAbsolutePosition } from '../../../utils/connectionPoints';
import { getPathData, inferConnectionDirection } from '../../../rendering/connectors/pathUtils';
import type { ConnectorTool } from '../../../config/bpmn-connectors';

interface ConnectorDrawingPreviewProps {
  drawingConnector: DrawingConnector;
  shapes: Shape[];
  viewportTransform: ViewportTransform;
  getConnectorConfig: (connectorType: string) => ConnectorTool | undefined;
}

/**
 * Preview line shown while drawing a new connector
 */
export function ConnectorDrawingPreview({
  drawingConnector,
  shapes,
  viewportTransform,
  getConnectorConfig,
}: ConnectorDrawingPreviewProps) {
  const fromShape = shapes.find((s) => s.id === drawingConnector.fromShapeId);
  if (!fromShape) return null;

  // Get connection points for the shape
  const connectionPoints = getConnectionPointsForShape(fromShape.type);

  // Parse the connection point ID from the full ID (format: "{shapeId}-{connectionPointId}")
  // Shape IDs are UUIDs with 5 parts, connection point ID is everything after
  const parts = drawingConnector.fromConnectionPointId.split('-');
  const connectionPointId = parts.slice(5).join('-');

  // Find the connection point
  const connectionPoint = connectionPoints.find((cp) => cp.id === connectionPointId);
  if (!connectionPoint) return null;

  // Calculate the absolute position
  const startPos = calculateAbsolutePosition(connectionPoint, fromShape);
  const start = { x: startPos.x, y: startPos.y };
  const end = { x: drawingConnector.currentX, y: drawingConnector.currentY };

  // Get the connector configuration to determine the style
  const connectorConfig = getConnectorConfig(drawingConnector.connectorType);
  const style = connectorConfig?.style || 'orthogonal';

  // Get source direction from drawingConnector or from connection point
  const sourceDirection = drawingConnector.sourceDirection || connectionPoint.direction;

  // Determine target direction based on target shape or infer from mouse position
  let targetDirection = drawingConnector.targetDirection;
  if (!targetDirection) {
    // If we don't have a target direction, infer it from the direction to the mouse
    targetDirection = inferConnectionDirection(start, end);
  }

  // Generate the path based on the connector style
  const { pathData } = getPathData(start, end, sourceDirection, targetDirection, style);

  const strokeWidth = 2 / viewportTransform.viewport.zoom;

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'visible',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      <path
        d={pathData}
        stroke="var(--canvas-preview-stroke)"
        strokeWidth={strokeWidth}
        strokeDasharray={`${strokeWidth * 4} ${strokeWidth * 2}`}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        pointerEvents="none"
      />
    </svg>
  );
}

import type { RefObject } from 'react';
import type { ViewportTransform } from '../utils/viewport';
import type { CreateConnectorDTO } from '~/core/entities/design-studio/types/Connector';
import type { ConnectorTool } from '~/design-studio/diagrams/bpmn/connectors';
import type { DrawingConnector } from './useInteractionState';
import { findConnectionPointById, getConnectionPointsForShape } from '../utils/connectionPoints';
import type { Shape } from '~/core/entities/design-studio/types/Shape';

interface UseConnectorDrawingProps {
  containerRef: RefObject<HTMLDivElement | null>;
  viewportTransform: ViewportTransform;
  addConnector: (connector: CreateConnectorDTO) => Promise<void>;
  activeConnectorType: string;
  getConnectorConfig: (connectorType: string) => ConnectorTool | undefined;
  isActive: boolean; // Driven by state machine
  drawingConnector: DrawingConnector | null; // From state machine
  diagramType?: string; // Diagram type for determining connection point behavior
  shapes: Map<string, Shape>; // All shapes on the canvas
}

interface UseConnectorDrawingReturn {
  startDrawingConnector: (connectionPointId: string, e: React.MouseEvent) => DrawingConnector;
  updateDrawingConnector: (screenX: number, screenY: number) => { currentX: number; currentY: number };
  finishDrawingConnector: (connectionPointId: string, e: React.MouseEvent) => Promise<void>;
}

/**
 * Hook for managing connector drawing interactions
 * State is managed externally by the interaction state machine
 */
export function useConnectorDrawing({
  containerRef,
  viewportTransform,
  addConnector,
  activeConnectorType,
  getConnectorConfig,
  isActive,
  drawingConnector,
  diagramType,
  shapes,
}: UseConnectorDrawingProps): UseConnectorDrawingReturn {
  const startDrawingConnector = (connectionPointId: string, e: React.MouseEvent): DrawingConnector => {
    e.stopPropagation();

    const container = containerRef.current;
    if (!container) {
      // Return a dummy connector if container is not available
      return {
        fromShapeId: '',
        fromConnectionPointId: connectionPointId,
        currentX: 0,
        currentY: 0,
        connectorType: activeConnectorType,
      };
    }

    // Parse shape ID from connection point ID (format: "{shapeId}-{actualConnectionPointId}")
    // Connection point IDs can have dashes (e.g., "w-20", "e-30")
    // Shape IDs are UUIDs with 4 dashes (8-4-4-4-12 format)
    // So we need to extract the UUID portion (first 5 segments) as the shape ID
    const parts = connectionPointId.split('-');
    // UUID has 5 parts: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const shapeId = parts.slice(0, 5).join('-');

    // Get current mouse position in canvas coordinates
    const rect = container.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const { x: canvasX, y: canvasY } = viewportTransform.screenToCanvas(screenX, screenY);

    // Get the source shape and find the connection point direction
    const sourceShape = shapes.get(shapeId);
    let sourceDirection: 'N' | 'S' | 'E' | 'W' | undefined;

    if (sourceShape) {
      const connectionPoints = getConnectionPointsForShape(sourceShape.type, sourceShape.height);
      // Extract the actual connection point ID (after the UUID)
      const actualConnectionPointId = parts.slice(5).join('-');
      const connectionPoint = findConnectionPointById(connectionPoints, actualConnectionPointId);
      sourceDirection = connectionPoint?.direction;
    }

    // Return connector data for state machine
    return {
      fromShapeId: shapeId,
      fromConnectionPointId: connectionPointId,
      currentX: canvasX,
      currentY: canvasY,
      connectorType: activeConnectorType,
      sourceDirection,
    };
  };

  const updateDrawingConnector = (screenX: number, screenY: number): { currentX: number; currentY: number } => {
    if (!isActive || !drawingConnector) {
      return { currentX: 0, currentY: 0 };
    }

    const { x: canvasX, y: canvasY } = viewportTransform.screenToCanvas(screenX, screenY);

    return { currentX: canvasX, currentY: canvasY };
  };

  const finishDrawingConnector = async (connectionPointId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!drawingConnector) return;

    // Parse shape ID from connection point ID (UUID has 5 parts)
    const parts = connectionPointId.split('-');
    const toShapeId = parts.slice(0, 5).join('-');

    // Don't allow connecting to the same shape (except for sequence self-messages)
    if (toShapeId === drawingConnector.fromShapeId && diagramType !== 'sequence') {
      return;
    }

    // Get the config for the active connector type
    const connectorConfig = getConnectorConfig(activeConnectorType);

    // Fallback to defaults if config not found
    const type = connectorConfig?.connectorType || 'line';
    const style = connectorConfig?.style || 'orthogonal';
    const markerStart = connectorConfig?.markerStart || 'none';
    const markerEnd = connectorConfig?.markerEnd || 'arrow';
    const lineType = connectorConfig?.lineType || 'solid';


    // For sequence diagrams, store explicit connection points for manual placement
    // Extract connection point IDs from the full connection point identifiers
    // Connection point ID comes after the UUID (5 segments)
    const sourceConnectionPointId = drawingConnector.fromConnectionPointId.split('-').slice(5).join('-');
    const targetConnectionPointId = connectionPointId.split('-').slice(5).join('-');

    // Create connector via command (with undo/redo support)
    await addConnector({
      type,
      sourceShapeId: drawingConnector.fromShapeId,
      targetShapeId: toShapeId,
      // For sequence diagrams, store explicit connection points for manual placement
      // For other diagrams, omit them so renderer calculates closest points dynamically
      ...(diagramType === 'sequence' && {
        sourceConnectionPoint: sourceConnectionPointId,
        targetConnectionPoint: targetConnectionPointId,
      }),
      style,
      markerStart,
      markerEnd,
      lineType,
      zIndex: 0,
    });
  };

  return {
    startDrawingConnector,
    updateDrawingConnector,
    finishDrawingConnector,
  };
}

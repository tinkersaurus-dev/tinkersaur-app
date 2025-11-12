import type { RefObject } from 'react';
import { screenToCanvas } from '../utils/canvas';
import type { CreateConnectorDTO } from '~/core/entities/design-studio/types/Connector';
import type { ConnectorTool } from '../config/bpmn-connectors';
import type { DrawingConnector } from './useInteractionState';

interface UseConnectorDrawingProps {
  containerRef: RefObject<HTMLDivElement | null>;
  zoom: number;
  panX: number;
  panY: number;
  addConnector: (connector: CreateConnectorDTO) => Promise<void>;
  activeConnectorType: string;
  getConnectorConfig: (connectorType: string) => ConnectorTool | undefined;
  isActive: boolean; // Driven by state machine
  drawingConnector: DrawingConnector | null; // From state machine
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
  zoom,
  panX,
  panY,
  addConnector,
  activeConnectorType,
  getConnectorConfig,
  isActive,
  drawingConnector,
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
      };
    }

    // Parse shape ID from connection point ID (format: "{shapeId}-{connectionPointId}")
    // For now, we'll assume the last part after the last dash is the connection point ID
    const parts = connectionPointId.split('-');
    const shapeId = parts.slice(0, -1).join('-');

    // Get current mouse position in canvas coordinates
    const rect = container.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const { x: canvasX, y: canvasY } = screenToCanvas(screenX, screenY, zoom, panX, panY);

    // Return connector data for state machine
    return {
      fromShapeId: shapeId,
      fromConnectionPointId: connectionPointId,
      currentX: canvasX,
      currentY: canvasY,
    };
  };

  const updateDrawingConnector = (screenX: number, screenY: number): { currentX: number; currentY: number } => {
    if (!isActive || !drawingConnector) {
      return { currentX: 0, currentY: 0 };
    }

    const { x: canvasX, y: canvasY } = screenToCanvas(screenX, screenY, zoom, panX, panY);

    return { currentX: canvasX, currentY: canvasY };
  };

  const finishDrawingConnector = async (connectionPointId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!drawingConnector) return;

    // Parse shape ID from connection point ID
    const parts = connectionPointId.split('-');
    const toShapeId = parts.slice(0, -1).join('-');

    // Don't allow connecting to the same shape
    if (toShapeId === drawingConnector.fromShapeId) {
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

    // Create connector via command (with undo/redo support)
    // NOTE: We omit sourceConnectionPoint and targetConnectionPoint
    // The renderer will dynamically calculate the closest connection points
    await addConnector({
      type,
      sourceShapeId: drawingConnector.fromShapeId,
      targetShapeId: toShapeId,
      // Connection points are omitted - they'll be calculated dynamically
      style,
      arrowType: markerEnd, // Keep for backwards compatibility
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

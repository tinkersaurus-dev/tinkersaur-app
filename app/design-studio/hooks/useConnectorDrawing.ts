import { useState } from 'react';
import type { RefObject } from 'react';
import { screenToCanvas } from '../utils/canvas';
import type { CreateConnectorDTO } from '~/core/entities/design-studio/types/Connector';
import type { ConnectorTool } from '../config/bpmn-connectors';

export interface DrawingConnector {
  fromShapeId: string;
  fromConnectionPointId: string;
  currentX: number;
  currentY: number;
}

interface UseConnectorDrawingProps {
  containerRef: RefObject<HTMLDivElement | null>;
  zoom: number;
  panX: number;
  panY: number;
  addConnector: (connector: CreateConnectorDTO) => Promise<void>;
  activeConnectorType: string;
  getConnectorConfig: (connectorType: string) => ConnectorTool | undefined;
}

interface UseConnectorDrawingReturn {
  drawingConnector: DrawingConnector | null;
  setDrawingConnector: (connector: DrawingConnector | null) => void;
  startDrawingConnector: (connectionPointId: string, e: React.MouseEvent) => void;
  updateDrawingConnector: (screenX: number, screenY: number) => void;
  finishDrawingConnector: (connectionPointId: string, e: React.MouseEvent) => Promise<void>;
  cancelDrawingConnector: () => void;
}

/**
 * Hook for managing connector drawing interactions
 */
export function useConnectorDrawing({
  containerRef,
  zoom,
  panX,
  panY,
  addConnector,
  activeConnectorType,
  getConnectorConfig,
}: UseConnectorDrawingProps): UseConnectorDrawingReturn {
  const [drawingConnector, setDrawingConnector] = useState<DrawingConnector | null>(null);

  const startDrawingConnector = (connectionPointId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const container = containerRef.current;
    if (!container) return;

    // Parse shape ID from connection point ID (format: "{shapeId}-{connectionPointId}")
    // For now, we'll assume the last part after the last dash is the connection point ID
    const parts = connectionPointId.split('-');
    const shapeId = parts.slice(0, -1).join('-');

    // Get current mouse position in canvas coordinates
    const rect = container.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const { x: canvasX, y: canvasY } = screenToCanvas(screenX, screenY, zoom, panX, panY);

    // Start drawing connector
    setDrawingConnector({
      fromShapeId: shapeId,
      fromConnectionPointId: connectionPointId,
      currentX: canvasX,
      currentY: canvasY,
    });
  };

  const updateDrawingConnector = (screenX: number, screenY: number) => {
    if (!drawingConnector) return;

    const { x: canvasX, y: canvasY } = screenToCanvas(screenX, screenY, zoom, panX, panY);

    setDrawingConnector((prev) =>
      prev ? { ...prev, currentX: canvasX, currentY: canvasY } : null
    );
  };

  const finishDrawingConnector = async (connectionPointId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!drawingConnector) return;

    // Parse shape ID from connection point ID
    const parts = connectionPointId.split('-');
    const toShapeId = parts.slice(0, -1).join('-');

    // Don't allow connecting to the same shape
    if (toShapeId === drawingConnector.fromShapeId) {
      setDrawingConnector(null);
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

    // Clear drawing state
    setDrawingConnector(null);
  };

  const cancelDrawingConnector = () => {
    setDrawingConnector(null);
  };

  return {
    drawingConnector,
    setDrawingConnector,
    startDrawingConnector,
    updateDrawingConnector,
    finishDrawingConnector,
    cancelDrawingConnector,
  };
}

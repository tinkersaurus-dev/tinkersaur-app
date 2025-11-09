import { useState } from 'react';
import type { RefObject } from 'react';
import { screenToCanvas } from '../utils/canvas';
import type { CreateConnectorDTO } from '~/core/entities/design-studio/types/Connector';

export interface DrawingConnector {
  fromShapeId: string;
  fromDirection: 'N' | 'S' | 'E' | 'W';
  currentX: number;
  currentY: number;
}

interface UseConnectorDrawingProps {
  containerRef: RefObject<HTMLDivElement | null>;
  zoom: number;
  panX: number;
  panY: number;
  addConnector: (connector: CreateConnectorDTO) => Promise<void>;
}

interface UseConnectorDrawingReturn {
  drawingConnector: DrawingConnector | null;
  setDrawingConnector: (connector: DrawingConnector | null) => void;
  startDrawingConnector: (pointId: string, direction: 'N' | 'S' | 'E' | 'W', e: React.MouseEvent) => void;
  updateDrawingConnector: (screenX: number, screenY: number) => void;
  finishDrawingConnector: (pointId: string, direction: 'N' | 'S' | 'E' | 'W', e: React.MouseEvent) => Promise<void>;
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
}: UseConnectorDrawingProps): UseConnectorDrawingReturn {
  const [drawingConnector, setDrawingConnector] = useState<DrawingConnector | null>(null);

  const startDrawingConnector = (pointId: string, direction: 'N' | 'S' | 'E' | 'W', e: React.MouseEvent) => {
    e.stopPropagation();

    const container = containerRef.current;
    if (!container) return;

    // Parse shape ID from point ID (format: "{shapeId}-{direction}")
    const shapeId = pointId.split('-').slice(0, -1).join('-');

    // Get current mouse position in canvas coordinates
    const rect = container.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const { x: canvasX, y: canvasY } = screenToCanvas(screenX, screenY, zoom, panX, panY);

    // Start drawing connector
    setDrawingConnector({
      fromShapeId: shapeId,
      fromDirection: direction,
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

  const finishDrawingConnector = async (pointId: string, direction: 'N' | 'S' | 'E' | 'W', e: React.MouseEvent) => {
    e.stopPropagation();

    if (!drawingConnector) return;

    // Parse shape ID from point ID
    const toShapeId = pointId.split('-').slice(0, -1).join('-');

    // Don't allow connecting to the same shape
    if (toShapeId === drawingConnector.fromShapeId) {
      setDrawingConnector(null);
      return;
    }

    // Create connector via command (with undo/redo support)
    // NOTE: We omit sourceConnectionPoint and targetConnectionPoint
    // The renderer will dynamically calculate the closest connection points
    await addConnector({
      type: 'line',
      sourceShapeId: drawingConnector.fromShapeId,
      targetShapeId: toShapeId,
      // Connection points are omitted - they'll be calculated dynamically
      style: 'orthogonal',
      arrowType: 'arrow',
      lineType: 'solid',
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

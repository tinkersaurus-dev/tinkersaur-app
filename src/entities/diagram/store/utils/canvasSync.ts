import type { Shape } from '@/entities/shape';
import type { Connector } from '@/entities/connector';
import { canvasInstanceRegistry } from '@/shared/model/stores/canvas/canvasInstanceRegistry';

/**
 * Sync a shape operation to the canvas instance local state.
 * Maintains immediate rendering without waiting for full diagram state propagation.
 */
export function syncShapeToCanvas(
  diagramId: string,
  action: 'add' | 'remove',
  shapeOrId: Shape | string
): void {
  const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
  if (action === 'add') {
    canvasInstance.getState().addLocalShape(shapeOrId as Shape);
  } else {
    canvasInstance.getState().removeLocalShape(shapeOrId as string);
  }
}

/**
 * Sync multiple shapes to the canvas instance local state.
 */
export function syncShapesToCanvas(
  diagramId: string,
  action: 'add' | 'remove',
  shapesOrIds: Shape[] | string[]
): void {
  const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
  if (action === 'add') {
    (shapesOrIds as Shape[]).forEach((shape) => {
      canvasInstance.getState().addLocalShape(shape);
    });
  } else {
    (shapesOrIds as string[]).forEach((shapeId) => {
      canvasInstance.getState().removeLocalShape(shapeId);
    });
  }
}

/**
 * Sync a connector operation to the canvas instance local state.
 * Maintains immediate rendering without waiting for full diagram state propagation.
 */
export function syncConnectorToCanvas(
  diagramId: string,
  action: 'add' | 'remove',
  connectorOrId: Connector | string
): void {
  const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
  if (action === 'add') {
    canvasInstance.getState().addLocalConnector(connectorOrId as Connector);
  } else {
    canvasInstance.getState().removeLocalConnector(connectorOrId as string);
  }
}

/**
 * Sync multiple connectors to the canvas instance local state.
 */
export function syncConnectorsToCanvas(
  diagramId: string,
  action: 'add' | 'remove',
  connectorsOrIds: Connector[] | string[]
): void {
  const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
  if (action === 'add') {
    (connectorsOrIds as Connector[]).forEach((connector) => {
      canvasInstance.getState().addLocalConnector(connector);
    });
  } else {
    (connectorsOrIds as string[]).forEach((connectorId) => {
      canvasInstance.getState().removeLocalConnector(connectorId);
    });
  }
}

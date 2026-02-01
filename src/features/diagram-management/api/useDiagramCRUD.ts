import { useDiagramStore } from '@/entities/diagram/store/useDiagramStore';
import type { Shape, CreateShapeDTO } from '@/entities/shape';
import type { CreateConnectorDTO } from '@/entities/connector';

/**
 * Hook for diagram CRUD operations
 *
 * Provides actions to manipulate shapes and connectors within a diagram.
 * Use in combination with useDiagram for data access.
 */
export function useDiagramCRUD(diagramId: string | undefined) {
  // Shape manipulation actions from store
  const addShapeAction = useDiagramStore((state) => state.addShape);
  const updateShapeAction = useDiagramStore((state) => state.updateShape);
  const updateShapesAction = useDiagramStore((state) => state.updateShapes);
  const deleteShapeAction = useDiagramStore((state) => state.deleteShape);
  const deleteShapesAction = useDiagramStore((state) => state.deleteShapes);

  // Connector manipulation actions from store
  const addConnectorAction = useDiagramStore((state) => state.addConnector);
  const deleteConnectorAction = useDiagramStore((state) => state.deleteConnector);
  const deleteConnectorsAction = useDiagramStore((state) => state.deleteConnectors);

  // Wrapper functions that bind the diagram ID
  const addShape = diagramId
    ? (shape: CreateShapeDTO) => addShapeAction(diagramId, shape)
    : undefined;
  const updateShape = diagramId
    ? (shapeId: string, updates: Partial<Shape>) => updateShapeAction(diagramId, shapeId, updates)
    : undefined;
  const updateShapes = diagramId
    ? (updates: Array<{ shapeId: string; updates: Partial<Shape> }>) => updateShapesAction(diagramId, updates)
    : undefined;
  const deleteShape = diagramId
    ? (shapeId: string) => deleteShapeAction(diagramId, shapeId)
    : undefined;
  const deleteShapes = diagramId
    ? (shapeIds: string[]) => deleteShapesAction(diagramId, shapeIds)
    : undefined;

  const addConnector = diagramId
    ? (connector: CreateConnectorDTO) => addConnectorAction(diagramId, connector)
    : undefined;
  const deleteConnector = diagramId
    ? (connectorId: string) => deleteConnectorAction(diagramId, connectorId)
    : undefined;
  const deleteConnectors = diagramId
    ? (connectorIds: string[]) => deleteConnectorsAction(diagramId, connectorIds)
    : undefined;

  return {
    addShape,
    updateShape,
    updateShapes,
    deleteShape,
    deleteShapes,
    addConnector,
    deleteConnector,
    deleteConnectors,
  };
}

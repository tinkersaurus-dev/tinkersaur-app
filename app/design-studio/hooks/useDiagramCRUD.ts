import { useDesignStudioEntityStore } from '~/core/entities/design-studio';
import type { Shape, CreateShapeDTO } from '~/core/entities/design-studio';
import type { CreateConnectorDTO } from '~/core/entities/design-studio/types/Connector';

/**
 * Hook for diagram CRUD operations
 *
 * Provides actions to manipulate shapes and connectors within a diagram.
 * Use in combination with useDiagram for data access.
 */
export function useDiagramCRUD(diagramId: string | undefined) {
  // Shape manipulation actions from store
  const addShapeAction = useDesignStudioEntityStore((state) => state.addShape);
  const updateShapeAction = useDesignStudioEntityStore((state) => state.updateShape);
  const updateShapesAction = useDesignStudioEntityStore((state) => state.updateShapes);
  const deleteShapeAction = useDesignStudioEntityStore((state) => state.deleteShape);

  // Connector manipulation actions from store
  const addConnectorAction = useDesignStudioEntityStore((state) => state.addConnector);
  const deleteConnectorAction = useDesignStudioEntityStore((state) => state.deleteConnector);

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

  const addConnector = diagramId
    ? (connector: CreateConnectorDTO) => addConnectorAction(diagramId, connector)
    : undefined;
  const deleteConnector = diagramId
    ? (connectorId: string) => deleteConnectorAction(diagramId, connectorId)
    : undefined;

  return {
    addShape,
    updateShape,
    updateShapes,
    deleteShape,
    addConnector,
    deleteConnector,
  };
}

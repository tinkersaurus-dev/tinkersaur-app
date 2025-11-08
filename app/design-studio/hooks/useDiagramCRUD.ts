import { useDesignStudioEntityStore } from '~/core/entities/design-studio';
import type { Shape, CreateShapeDTO } from '~/core/entities/design-studio';

/**
 * Hook for diagram CRUD operations
 *
 * Provides actions to manipulate shapes within a diagram.
 * Use in combination with useDiagram for data access.
 */
export function useDiagramCRUD(diagramId: string | undefined) {
  // Shape manipulation actions from store
  const addShapeAction = useDesignStudioEntityStore((state) => state.addShape);
  const updateShapeAction = useDesignStudioEntityStore((state) => state.updateShape);
  const updateShapesAction = useDesignStudioEntityStore((state) => state.updateShapes);
  const deleteShapeAction = useDesignStudioEntityStore((state) => state.deleteShape);

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

  return {
    addShape,
    updateShape,
    updateShapes,
    deleteShape,
  };
}

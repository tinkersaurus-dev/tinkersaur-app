/**
 * @deprecated Canvas API has been removed.
 *
 * Canvas content (shapes, connectors, viewport) now lives directly within the Diagram entity.
 * Use `diagramApi` methods instead:
 *
 * Migration:
 * - `canvasApi.getCanvasContent(diagramId)` → `diagramApi.get(diagramId)` (returns full diagram with shapes)
 * - `canvasApi.addShape(diagramId, shape)` → `diagramApi.addShape(diagramId, shape)`
 * - `canvasApi.updateShape(diagramId, shapeId, updates)` → `diagramApi.updateShape(diagramId, shapeId, updates)`
 * - `canvasApi.deleteShape(diagramId, shapeId)` → `diagramApi.deleteShape(diagramId, shapeId)`
 * - `canvasApi.updateCanvasMetadata(diagramId, metadata)` → `diagramApi.updateViewport(diagramId, viewport)`
 *
 * See: diagramApi.ts for the new API
 */

throw new Error(
  'canvasApi has been deprecated. Use diagramApi instead. See file comments for migration guide.'
);

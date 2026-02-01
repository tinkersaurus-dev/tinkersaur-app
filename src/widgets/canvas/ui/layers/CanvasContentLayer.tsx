import { memo, Suspense } from 'react';
import { useCanvasDiagram } from '../contexts/CanvasDiagramContext';
import { useCanvasViewport } from '../contexts/CanvasViewportContext';
import { useCanvasSelection } from '../contexts/CanvasSelectionContext';
import { useCanvasEvents } from '../contexts/CanvasEventsContext';
import { CanvasShapesList } from '../rendering/CanvasShapesList';
import { CanvasConnectorsList } from '../rendering/CanvasConnectorsList';
import { ConnectorDrawingPreview } from '../rendering/ConnectorDrawingPreview';

/**
 * CanvasContentLayer Component
 *
 * Renders the main canvas content: shapes, connectors, and drawing preview.
 * Applies the viewport transform to position content correctly.
 *
 * Subscribes to:
 * - DiagramContext (shapes, connectors)
 * - ViewportContext (transform)
 * - SelectionContext (selection, hover, editing states)
 * - EventsContext (event handlers)
 *
 * This layer is isolated from toolbar and menu updates.
 */
function CanvasContentLayerComponent() {
  const { shapes, connectors } = useCanvasDiagram();
  const { viewportTransform } = useCanvasViewport();
  const {
    selectedShapeIds,
    hoveredShapeId,
    selectedConnectorIds,
    hoveredConnectorId,
    hoveredContainerId,
    drawingConnector,
    editingEntityId,
    editingEntityType,
  } = useCanvasSelection();
  const {
    handleShapeMouseDown,
    handleShapeMouseEnter,
    handleShapeMouseLeave,
    handleShapeDoubleClick,
    handleLabelChange,
    handleFinishEditing,
    handleStartDrawingConnector,
    handleFinishDrawingConnector,
    handleResizeStart,
    handleConnectorMouseDown,
    handleConnectorMouseEnter,
    handleConnectorMouseLeave,
    handleConnectorDoubleClick,
    connectorTypeManager,
  } = useCanvasEvents();

  return (
    <div
      className="absolute inset-0"
      style={{
        transform: viewportTransform.getTransformString(),
        transformOrigin: '0 0',
      }}
    >
      {/* Wrap shapes and connectors in Suspense so they appear together
          after lazy-loaded shape renderers finish loading */}
      <Suspense fallback={null}>
        {/* Render all shapes */}
        <CanvasShapesList
          shapes={shapes}
          selectedShapeIds={selectedShapeIds}
          hoveredShapeId={hoveredShapeId}
          hoveredContainerId={hoveredContainerId}
          viewportTransform={viewportTransform}
          editingEntityId={editingEntityId}
          editingEntityType={editingEntityType}
          onMouseDown={handleShapeMouseDown}
          onMouseEnter={handleShapeMouseEnter}
          onMouseLeave={handleShapeMouseLeave}
          onDoubleClick={handleShapeDoubleClick}
          onLabelChange={handleLabelChange}
          onFinishEditing={handleFinishEditing}
          onConnectionPointMouseDown={handleStartDrawingConnector}
          onConnectionPointMouseUp={handleFinishDrawingConnector}
          onResizeStart={handleResizeStart}
        />

        {/* Render all connectors */}
        <CanvasConnectorsList
          connectors={connectors}
          shapes={shapes}
          selectedConnectorIds={selectedConnectorIds}
          hoveredConnectorId={hoveredConnectorId}
          viewportTransform={viewportTransform}
          editingEntityId={editingEntityId}
          editingEntityType={editingEntityType}
          onMouseDown={handleConnectorMouseDown}
          onMouseEnter={handleConnectorMouseEnter}
          onMouseLeave={handleConnectorMouseLeave}
          onDoubleClick={handleConnectorDoubleClick}
          onLabelChange={handleLabelChange}
          onFinishEditing={handleFinishEditing}
        />
      </Suspense>

      {/* Connector drawing preview line */}
      {drawingConnector && (
        <ConnectorDrawingPreview
          drawingConnector={drawingConnector}
          shapes={shapes}
          viewportTransform={viewportTransform}
          getConnectorConfig={connectorTypeManager.getConnectorConfig}
        />
      )}
    </div>
  );
}

export const CanvasContentLayer = memo(CanvasContentLayerComponent);

import { useCanvasDiagram } from './CanvasDiagramContext';
import { useCanvasViewport } from './CanvasViewportContext';
import { useCanvasSelection } from './CanvasSelectionContext';
import { useCanvasEvents } from './CanvasEventsContext';
import { MENU_IDS } from '../../../hooks/useContextMenuManager';
import { GridBackground } from '../ui/GridBackground';
import { ContextMenu } from '../menus/ContextMenu';
import { BpmnToolsetPopover } from '../menus/popovers/BpmnToolsetPopover';
import { ClassToolsetPopover } from '../menus/popovers/ClassToolsetPopover';
import { SequenceToolsetPopover } from '../menus/popovers/SequenceToolsetPopover';
import { ConnectorToolsetPopover } from '../menus/popovers/ConnectorToolsetPopover';
import { ConnectorContextMenu } from '../menus/ConnectorContextMenu';
import { CanvasDebugInfo } from '../ui/CanvasDebugInfo';
import { ConnectorDrawingPreview } from '../rendering/ConnectorDrawingPreview';
import { CanvasShapesList } from '../rendering/CanvasShapesList';
import { CanvasConnectorsList } from '../rendering/CanvasConnectorsList';
import CanvasToolbar from '../../toolbar/CanvasToolbar';
import CanvasTextToolbar from '../../toolbar/CanvasTextToolbar';
import { MermaidViewer } from '../../mermaid/MermaidViewer';
import { RoutingDebugOverlay } from '../debug/RoutingDebugOverlay';
import { setDebugGraph } from '../debug/routingDebugState';

/**
 * Canvas View Component
 *
 * Pure presentation layer for the Canvas. Consumes CanvasController context
 * and renders UI based on state. Contains no business logic.
 *
 * Responsibilities:
 * - Render canvas container with viewport transform
 * - Render shapes, connectors, and UI overlays
 * - Delegate all events to handlers from context
 * - Display menus, toolbars, and popovers based on context state
 */

export function CanvasView() {
  // Consume focused contexts
  const {
    diagramId,
    diagram,
    loading,
    shapes,
    connectors,
  } = useCanvasDiagram();

  const {
    viewportTransform,
  } = useCanvasViewport();

  const {
    selectedShapeIds,
    hoveredShapeId,
    selectedConnectorIds,
    hoveredConnectorId,
    mode,
    selectionBox,
    drawingConnector,
    editingEntityId,
    editingEntityType,
    activeConnectorType,
  } = useCanvasSelection();

  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleContextMenu,
    handleShapeMouseDown,
    handleShapeMouseEnter,
    handleShapeMouseLeave,
    handleShapeDoubleClick,
    handleStartDrawingConnector,
    handleFinishDrawingConnector,
    handleConnectorMouseDown,
    handleConnectorMouseEnter,
    handleConnectorMouseLeave,
    handleConnectorDoubleClick,
    handleLabelChange,
    handleFinishEditing,
    updateStereotype,
    addAttribute,
    deleteAttribute,
    updateAttribute,
    updateAttributeLocal,
    addMethod,
    deleteMethod,
    updateMethod,
    updateMethodLocal,
    addLiteral,
    deleteLiteral,
    updateLiteral,
    updateLiteralLocal,
    menuManager,
    handleAddRectangle,
    handleBpmnToolSelect,
    handleClassToolSelect,
    handleSequenceToolSelect,
    connectorTypeManager,
    toolbarButtons,
    containerRef,
  } = useCanvasEvents();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
        Loading canvas...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[var(--bg-light)] focus:outline-none"
      tabIndex={0}
      onMouseDown={(e) => {
        // Focus the canvas to enable paste events
        if (containerRef.current) {
          containerRef.current.focus();
        }
        handleMouseDown(e);
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
      onDragStart={(e) => e.preventDefault()}
      style={{
        touchAction: 'none',
        cursor: mode === 'panning' ? 'grabbing' : 'default',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Grid Layer (screen space, no transform) */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full">
          <g transform={`translate(${viewportTransform.viewport.panX}, ${viewportTransform.viewport.panY}) scale(${viewportTransform.viewport.zoom})`}>
            <GridBackground gridSize={10} />
          </g>
        </svg>
      </div>

      {/* Unified Canvas Content - All elements as direct children */}
      <div
        className="absolute inset-0"
        style={{
          transform: viewportTransform.getTransformString(),
          transformOrigin: '0 0',
        }}
      >
        {/* Render all shapes */}
        <CanvasShapesList
          shapes={shapes}
          selectedShapeIds={selectedShapeIds}
          hoveredShapeId={hoveredShapeId}
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
          onClassStereotypeChange={updateStereotype}
          onClassAddAttribute={addAttribute}
          onClassDeleteAttribute={deleteAttribute}
          onClassUpdateAttribute={updateAttribute}
          onClassUpdateAttributeLocal={updateAttributeLocal}
          onClassAddMethod={addMethod}
          onClassDeleteMethod={deleteMethod}
          onClassUpdateMethod={updateMethod}
          onClassUpdateMethodLocal={updateMethodLocal}
          onEnumerationAddLiteral={addLiteral}
          onEnumerationDeleteLiteral={deleteLiteral}
          onEnumerationUpdateLiteral={updateLiteral}
          onEnumerationUpdateLiteralLocal={updateLiteralLocal}
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

      {/* Context menu / Toolset popover (rendered in screen space, not transformed) */}
      {menuManager.isMenuOpen(MENU_IDS.BPMN_TOOLSET_POPOVER) && menuManager.activeMenuConfig && (
        <BpmnToolsetPopover
          x={menuManager.activeMenuConfig.screenPosition.x}
          y={menuManager.activeMenuConfig.screenPosition.y}
          canvasX={menuManager.activeMenuConfig.canvasPosition?.x ?? 0}
          canvasY={menuManager.activeMenuConfig.canvasPosition?.y ?? 0}
          isOpen={true}
          onClose={menuManager.closeMenu}
          onToolSelect={handleBpmnToolSelect}
          drawingConnector={drawingConnector}
        />
      )}
      {menuManager.isMenuOpen(MENU_IDS.CLASS_TOOLSET_POPOVER) && menuManager.activeMenuConfig && (
        <ClassToolsetPopover
          x={menuManager.activeMenuConfig.screenPosition.x}
          y={menuManager.activeMenuConfig.screenPosition.y}
          canvasX={menuManager.activeMenuConfig.canvasPosition?.x ?? 0}
          canvasY={menuManager.activeMenuConfig.canvasPosition?.y ?? 0}
          isOpen={true}
          onClose={menuManager.closeMenu}
          onToolSelect={handleClassToolSelect}
          drawingConnector={drawingConnector}
        />
      )}
      {menuManager.isMenuOpen(MENU_IDS.SEQUENCE_TOOLSET_POPOVER) && menuManager.activeMenuConfig && (
        <SequenceToolsetPopover
          x={menuManager.activeMenuConfig.screenPosition.x}
          y={menuManager.activeMenuConfig.screenPosition.y}
          canvasX={menuManager.activeMenuConfig.canvasPosition?.x ?? 0}
          canvasY={menuManager.activeMenuConfig.canvasPosition?.y ?? 0}
          isOpen={true}
          onClose={menuManager.closeMenu}
          onToolSelect={handleSequenceToolSelect}
          drawingConnector={drawingConnector}
        />
      )}
      {menuManager.isMenuOpen(MENU_IDS.CANVAS_CONTEXT_MENU) && menuManager.activeMenuConfig && (
        <ContextMenu
          x={menuManager.activeMenuConfig.screenPosition.x}
          y={menuManager.activeMenuConfig.screenPosition.y}
          isOpen={true}
          onClose={menuManager.closeMenu}
          onAddRectangle={handleAddRectangle}
        />
      )}

      {/* Selection box (rendered in screen space, not transformed) */}
      {selectionBox && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${Math.min(selectionBox.startX, selectionBox.endX)}px`,
            top: `${Math.min(selectionBox.startY, selectionBox.endY)}px`,
            width: `${Math.abs(selectionBox.endX - selectionBox.startX)}px`,
            height: `${Math.abs(selectionBox.endY - selectionBox.startY)}px`,
            border: '2px dashed var(--canvas-selection-box-border)',
            backgroundColor: 'var(--canvas-selection-box-bg)',
          }}
        />
      )}

      {/* Canvas Toolbar */}
      <CanvasToolbar placement="bottom" buttons={toolbarButtons} />

      {/* Canvas Text Toolbar (right-side) */}
      <CanvasTextToolbar diagramType={diagram?.type} />

      {/* Mermaid Viewer */}
      <MermaidViewer />

      {/* Connector Toolset Popover */}
      {menuManager.isMenuOpen(MENU_IDS.CONNECTOR_TOOLBAR_POPOVER) && menuManager.activeMenuConfig && (
        <ConnectorToolsetPopover
          x={menuManager.activeMenuConfig.screenPosition.x}
          y={menuManager.activeMenuConfig.screenPosition.y}
          isOpen={true}
          onClose={menuManager.closeMenu}
          onConnectorSelect={(tool) => {
            connectorTypeManager.handleConnectorSelect(tool);
            menuManager.closeMenu();
          }}
          connectorTools={connectorTypeManager.availableConnectorTools}
          activeConnectorType={activeConnectorType}
        />
      )}

      {/* Connector Context Menu (right-click on connector) */}
      {menuManager.isMenuOpen(MENU_IDS.CONNECTOR_CONTEXT_MENU) && menuManager.activeMenuConfig && menuManager.activeMenuConfig.metadata?.connectorId && (
        <ConnectorContextMenu
          x={menuManager.activeMenuConfig.screenPosition.x}
          y={menuManager.activeMenuConfig.screenPosition.y}
          isOpen={true}
          onClose={menuManager.closeMenu}
          onConnectorTypeChange={async (tool) => {
            await connectorTypeManager.handleConnectorTypeChange(tool, menuManager.activeMenuConfig!.metadata!.connectorId as string);
            menuManager.closeMenu();
          }}
          connectorTools={connectorTypeManager.availableConnectorTools}
          currentConnectorType={connectors.find(c => c.id === menuManager.activeMenuConfig?.metadata?.connectorId)?.type}
        />
      )}

      {/* Debug info (optional - can be removed) */}
      <CanvasDebugInfo diagramId={diagramId} zoom={viewportTransform.viewport.zoom} shapesCount={shapes.length} />

      {/* Routing Debug Overlay - Press 'D' to toggle */}
      <RoutingDebugOverlay />
    </div>
  );
}

// Expose debug function globally
if (typeof window !== 'undefined') {
  (window as Window & { setRoutingDebugGraph?: typeof setDebugGraph }).setRoutingDebugGraph = setDebugGraph;
}

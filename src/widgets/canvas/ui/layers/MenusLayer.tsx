import { memo } from 'react';
import { useCanvasDiagram } from '../contexts/CanvasDiagramContext';
import { useCanvasSelection } from '../contexts/CanvasSelectionContext';
import { useCanvasEvents } from '../contexts/CanvasEventsContext';
import { useShapeSubtypeManager } from '../../lib/hooks/useShapeSubtypeManager';
import { useDiagramStore } from '@/entities/diagram/store/useDiagramStore';
import { MENU_IDS } from '../../lib/hooks/useContextMenuManager';
import { ContextMenu } from '../menus/ContextMenu';
import { BpmnToolsetPopover } from '@/features/diagram-rendering/bpmn/components/ToolsetPopover';
import { ClassToolsetPopover } from '../menus/popovers/ClassToolsetPopover';
import { SequenceToolsetPopover } from '@/features/diagram-rendering/sequence/components/ToolsetPopover';
import { ArchitectureToolsetPopover } from '@/features/diagram-rendering/architecture/components/ToolsetPopover';
import { EntityRelationshipToolsetPopover } from '../menus/popovers/EntityRelationshipToolsetPopover';
import { ConnectorToolsetPopover } from '../menus/popovers/ConnectorToolsetPopover';
import { ConnectorContextMenu } from '../menus/ConnectorContextMenu';
import { ShapeContextMenu } from '../menus/ShapeContextMenu';

/**
 * MenusLayer Component
 *
 * Renders all context menus and toolset popovers.
 * Isolated from canvas content updates.
 *
 * Subscribes to:
 * - DiagramContext (for shapes/connectors lookup in context menus)
 * - SelectionContext (for drawingConnector state)
 * - EventsContext (menuManager, tool handlers)
 *
 * Does NOT trigger re-renders of shape/connector content when menus open/close.
 */
function MenusLayerComponent() {
  const { diagram, shapes, connectors } = useCanvasDiagram();
  const { drawingConnector, activeConnectorType } = useCanvasSelection();
  const {
    menuManager,
    handleAddRectangle,
    handleBpmnToolSelect,
    handleClassToolSelect,
    handleSequenceToolSelect,
    handleArchitectureToolSelect,
    handleEntityRelationshipToolSelect,
    connectorTypeManager,
  } = useCanvasEvents();

  // Shape subtype manager for context menu
  const commandFactory = useDiagramStore((state) => state.commandFactory);
  const shapeSubtypeManager = useShapeSubtypeManager({
    diagramId: diagram?.id ?? '',
    diagramType: diagram?.type,
    commandFactory,
  });

  return (
    <>
      {/* BPMN Toolset Popover */}
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

      {/* Class Toolset Popover */}
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

      {/* Sequence Toolset Popover */}
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

      {/* Architecture Toolset Popover */}
      {menuManager.isMenuOpen(MENU_IDS.ARCHITECTURE_TOOLSET_POPOVER) && menuManager.activeMenuConfig && (
        <ArchitectureToolsetPopover
          x={menuManager.activeMenuConfig.screenPosition.x}
          y={menuManager.activeMenuConfig.screenPosition.y}
          canvasX={menuManager.activeMenuConfig.canvasPosition?.x ?? 0}
          canvasY={menuManager.activeMenuConfig.canvasPosition?.y ?? 0}
          isOpen={true}
          onClose={menuManager.closeMenu}
          onToolSelect={handleArchitectureToolSelect}
          drawingConnector={drawingConnector}
        />
      )}

      {/* Entity Relationship Toolset Popover */}
      {menuManager.isMenuOpen(MENU_IDS.ENTITY_RELATIONSHIP_TOOLSET_POPOVER) && menuManager.activeMenuConfig && (
        <EntityRelationshipToolsetPopover
          x={menuManager.activeMenuConfig.screenPosition.x}
          y={menuManager.activeMenuConfig.screenPosition.y}
          canvasX={menuManager.activeMenuConfig.canvasPosition?.x ?? 0}
          canvasY={menuManager.activeMenuConfig.canvasPosition?.y ?? 0}
          isOpen={true}
          onClose={menuManager.closeMenu}
          onToolSelect={handleEntityRelationshipToolSelect}
          drawingConnector={drawingConnector}
        />
      )}

      {/* Canvas Context Menu */}
      {menuManager.isMenuOpen(MENU_IDS.CANVAS_CONTEXT_MENU) && menuManager.activeMenuConfig && (
        <ContextMenu
          x={menuManager.activeMenuConfig.screenPosition.x}
          y={menuManager.activeMenuConfig.screenPosition.y}
          isOpen={true}
          onClose={menuManager.closeMenu}
          onAddRectangle={handleAddRectangle}
        />
      )}

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
          onSourceMarkerChange={async (arrowType) => {
            await connectorTypeManager.handleSourceMarkerChange(arrowType, menuManager.activeMenuConfig!.metadata!.connectorId as string);
          }}
          onTargetMarkerChange={async (arrowType) => {
            await connectorTypeManager.handleTargetMarkerChange(arrowType, menuManager.activeMenuConfig!.metadata!.connectorId as string);
          }}
          connectorTools={connectorTypeManager.availableConnectorTools}
          currentConnector={connectors.find(c => c.id === menuManager.activeMenuConfig?.metadata?.connectorId)}
          currentConnectorType={connectors.find(c => c.id === menuManager.activeMenuConfig?.metadata?.connectorId)?.type}
          diagramType={diagram?.type}
        />
      )}

      {/* Shape Context Menu (right-click on shape) */}
      {menuManager.isMenuOpen(MENU_IDS.SHAPE_CONTEXT_MENU) && menuManager.activeMenuConfig && menuManager.activeMenuConfig.metadata?.shapeId && (
        <ShapeContextMenu
          x={menuManager.activeMenuConfig.screenPosition.x}
          y={menuManager.activeMenuConfig.screenPosition.y}
          isOpen={true}
          onClose={menuManager.closeMenu}
          onShapeSubtypeChange={async (tool) => {
            await shapeSubtypeManager.handleShapeSubtypeChange(tool, menuManager.activeMenuConfig!.metadata!.shapeId as string);
            menuManager.closeMenu();
          }}
          shapeTools={shapeSubtypeManager.getAvailableSubtypes(shapes.find(s => s.id === menuManager.activeMenuConfig?.metadata?.shapeId)?.type ?? '')}
          currentShapeSubtype={shapes.find(s => s.id === menuManager.activeMenuConfig?.metadata?.shapeId)?.subtype}
        />
      )}
    </>
  );
}

export const MenusLayer = memo(MenusLayerComponent);

/**
 * Canvas Tool Manager Hook
 *
 * Manages tool selection for all diagram types and toolbar configuration.
 * Provides a clean interface for creating shapes via tools and configuring the toolbar.
 *
 * This hook consolidates:
 * - Tool handlers for BPMN, Class, Sequence, and Architecture diagrams
 * - Connector type management
 * - Toolbar button configuration
 * - handleAddRectangle for simple context menu
 */

import { useCallback, useMemo } from 'react';
import { useToolHandler } from '../../../hooks/useToolHandler';
import { useConnectorTypeManager } from '../../../hooks/useConnectorTypeManager';
import { MENU_IDS } from '../../../hooks/useContextMenuManager';
import { createToolbarButtons } from '../config/toolbarConfig';
import { getGlobalToolById } from '../../../config/global-tools';
import {
  mapBpmnToolToShape,
  mapClassToolToShape,
  mapSequenceToolToShape,
  mapArchitectureToolToShape,
  mapEntityRelationshipToolToShape,
  mapGlobalToolToShape,
} from '../../../utils/toolMappers';
import type { Tool as BpmnTool } from '~/design-studio/diagrams/bpmn/tools';
import type { Tool as ClassTool } from '~/design-studio/diagrams/class/tools';
import type { Tool as SequenceTool } from '~/design-studio/diagrams/sequence/tools';
import type { Tool as ArchitectureTool } from '~/design-studio/diagrams/architecture/tools';
import type { Tool as EntityRelationshipTool } from '~/design-studio/diagrams/entity-relationship/tools';
import type { ToolbarButton } from '../../toolbar/CanvasToolbar';
import type { DiagramType } from '~/core/entities/design-studio/types/Diagram';
import type { ViewportTransform } from '../../../utils/viewport';
import type { CommandFactory } from '~/core/commands/CommandFactory';
import type { ArrowType, Connector } from '~/core/entities/design-studio/types/Connector';
import type { UseContextMenuManagerReturn } from '../../../hooks/useContextMenuManager';
import type { ConnectorTool } from '~/design-studio/diagrams/bpmn/connectors';
import type { JSX } from 'react';

export interface UseCanvasToolManagerProps {
  diagramId: string;
  diagramType: DiagramType | undefined;
  addShape: ((shape: Parameters<NonNullable<ReturnType<typeof import('../../../hooks/useDiagramCRUD').useDiagramCRUD>['addShape']>>[0]) => Promise<string>) | undefined;
  addConnector: ReturnType<typeof import('../../../hooks/useDiagramCRUD').useDiagramCRUD>['addConnector'];
  activeConnectorType: string;
  menuManager: UseContextMenuManagerReturn;
  viewportTransform: ViewportTransform;
  gridSnappingEnabled: boolean;
  gridDisplayMode: 'dots' | 'lines';
  setGridSnappingEnabled: (enabled: boolean) => void;
  setGridDisplayMode: (mode: 'dots' | 'lines') => void;
  setActiveConnectorType: (type: string) => void;
  commandFactory: CommandFactory;
  connectors: Connector[];
}

export interface UseCanvasToolManagerReturn {
  // Tool selection handlers
  handleBpmnToolSelect: (tool: BpmnTool, canvasX: number, canvasY: number) => Promise<void>;
  handleClassToolSelect: (tool: ClassTool, canvasX: number, canvasY: number) => Promise<void>;
  handleSequenceToolSelect: (tool: SequenceTool, canvasX: number, canvasY: number) => Promise<void>;
  handleArchitectureToolSelect: (tool: ArchitectureTool, canvasX: number, canvasY: number) => Promise<void>;
  handleEntityRelationshipToolSelect: (tool: EntityRelationshipTool, canvasX: number, canvasY: number) => Promise<void>;
  handleAddRectangle: () => Promise<void>;

  // Connector type management
  connectorTypeManager: {
    handleConnectorSelect: (connectorTool: ConnectorTool) => void;
    handleConnectorTypeChange: (connectorTool: ConnectorTool, connectorId: string) => Promise<void>;
    handleSourceMarkerChange: (arrowType: ArrowType, connectorId: string) => Promise<void>;
    handleTargetMarkerChange: (arrowType: ArrowType, connectorId: string) => Promise<void>;
    availableConnectorTools: ConnectorTool[];
    activeConnectorIcon: JSX.Element;
    getConnectorConfig: (connectorType: string) => ConnectorTool | undefined;
  };
  handleConnectorToolbarClick: (buttonElement?: HTMLButtonElement) => void;

  // Toolbar
  toolbarButtons: ToolbarButton[];
  handleZoomReset: () => void;
}

export function useCanvasToolManager({
  diagramId,
  diagramType,
  addShape,
  addConnector,
  activeConnectorType,
  menuManager,
  viewportTransform,
  gridSnappingEnabled,
  gridDisplayMode,
  setGridSnappingEnabled,
  setGridDisplayMode,
  setActiveConnectorType,
  commandFactory,
  connectors,
}: UseCanvasToolManagerProps): UseCanvasToolManagerReturn {
  // Use connector type manager hook for all connector type management
  const connectorTypeManager = useConnectorTypeManager({
    diagramId,
    diagramType,
    activeConnectorType,
    setActiveConnectorType,
    commandFactory,
    connectors,
  });

  // Use polymorphic tool handlers for BPMN, Class, Sequence, and Architecture diagrams
  // These handlers check if the tool is a global tool and use the appropriate mapper
  const { handleToolSelect: handleBpmnToolSelect } = useToolHandler<BpmnTool>({
    addShape,
    addConnector,
    activeConnectorType,
    menuManager,
    toolToShapeMapper: (tool, canvasX, canvasY) => {
      // Check if this is a global tool
      const globalTool = getGlobalToolById(tool.id);
      if (globalTool) {
        return mapGlobalToolToShape(globalTool, canvasX, canvasY);
      }
      return mapBpmnToolToShape(tool, canvasX, canvasY);
    },
  });

  const { handleToolSelect: handleClassToolSelect } = useToolHandler<ClassTool>({
    addShape,
    addConnector,
    activeConnectorType,
    menuManager,
    toolToShapeMapper: (tool, canvasX, canvasY) => {
      // Check if this is a global tool
      const globalTool = getGlobalToolById(tool.id);
      if (globalTool) {
        return mapGlobalToolToShape(globalTool, canvasX, canvasY);
      }
      return mapClassToolToShape(tool, canvasX, canvasY);
    },
  });

  const { handleToolSelect: handleSequenceToolSelect } = useToolHandler<SequenceTool>({
    addShape,
    addConnector,
    activeConnectorType,
    menuManager,
    toolToShapeMapper: (tool, canvasX, canvasY) => {
      // Check if this is a global tool
      const globalTool = getGlobalToolById(tool.id);
      if (globalTool) {
        return mapGlobalToolToShape(globalTool, canvasX, canvasY);
      }
      return mapSequenceToolToShape(tool, canvasX, canvasY);
    },
  });

  const { handleToolSelect: handleArchitectureToolSelect } = useToolHandler<ArchitectureTool>({
    addShape,
    addConnector,
    activeConnectorType,
    menuManager,
    toolToShapeMapper: (tool, canvasX, canvasY) => {
      // Check if this is a global tool
      const globalTool = getGlobalToolById(tool.id);
      if (globalTool) {
        return mapGlobalToolToShape(globalTool, canvasX, canvasY);
      }
      return mapArchitectureToolToShape(tool, canvasX, canvasY);
    },
  });

  const { handleToolSelect: handleEntityRelationshipToolSelect } = useToolHandler<EntityRelationshipTool>({
    addShape,
    addConnector,
    activeConnectorType,
    menuManager,
    toolToShapeMapper: (tool, canvasX, canvasY) => {
      // Check if this is a global tool
      const globalTool = getGlobalToolById(tool.id);
      if (globalTool) {
        return mapGlobalToolToShape(globalTool, canvasX, canvasY);
      }
      return mapEntityRelationshipToolToShape(tool, canvasX, canvasY);
    },
  });

  // Handle adding rectangle from simple context menu
  const handleAddRectangle = useCallback(async () => {
    if (!addShape) return;

    const menuConfig = menuManager.getMenuConfig(MENU_IDS.CANVAS_CONTEXT_MENU);
    if (!menuConfig?.canvasPosition) return;

    const { x: canvasX, y: canvasY } = menuConfig.canvasPosition;

    // Persist to entity store
    await addShape({
      type: 'rectangle',
      x: canvasX,
      y: canvasY,
      width: 120,
      height: 80,
      zIndex: 0,
      locked: false,
      isPreview: false,
    });

    menuManager.closeMenu();
  }, [addShape, menuManager]);

  // Handle connector toolbar button click
  const handleConnectorToolbarClick = useCallback((buttonElement?: HTMLButtonElement) => {
    // Create a ref object from the button element if provided
    const buttonRef = buttonElement ? { current: buttonElement } : undefined;
    menuManager.openConnectorToolbarPopover(buttonRef);
  }, [menuManager]);

  // Handle zoom reset button click
  const handleZoomReset = useCallback(() => {
    viewportTransform.setViewport(1, 0, 0);
  }, [viewportTransform]);

  // Configure toolbar buttons
  const toolbarButtons = useMemo(() =>
    createToolbarButtons({
      diagramType,
      gridSnappingEnabled,
      gridDisplayMode,
      activeConnectorIcon: connectorTypeManager.activeConnectorIcon,
      zoom: viewportTransform.viewport.zoom,
      setGridSnappingEnabled,
      setGridDisplayMode,
      handleConnectorToolbarClick,
      handleZoomReset,
    }),
    [diagramType, connectorTypeManager.activeConnectorIcon, handleConnectorToolbarClick, handleZoomReset, gridSnappingEnabled, gridDisplayMode, viewportTransform.viewport.zoom, setGridSnappingEnabled, setGridDisplayMode]
  );

  return {
    // Tool selection handlers
    handleBpmnToolSelect,
    handleClassToolSelect,
    handleSequenceToolSelect,
    handleArchitectureToolSelect,
    handleEntityRelationshipToolSelect,
    handleAddRectangle,

    // Connector type management
    connectorTypeManager,
    handleConnectorToolbarClick,

    // Toolbar
    toolbarButtons,
    handleZoomReset,
  };
}

/**
 * Canvas Event Orchestrator Hook
 *
 * Coordinates all event handlers by composing existing focused hooks
 * and connecting them to the interaction state machine.
 *
 * This hook consolidates:
 * - Interaction state machine (useInteractionState)
 * - Canvas panning (useCanvasPanning)
 * - Label editing (useCanvasLabelEditing)
 * - Selection (useCanvasSelection)
 * - Connector drawing (useConnectorDrawing)
 * - Shape dragging (useShapeDragging)
 * - Shape resizing (useShapeResizing)
 * - Shape interaction (useShapeInteraction)
 * - Keyboard handlers (useCanvasKeyboardHandlers)
 * - Mouse orchestration (useCanvasMouseOrchestration)
 * - Context menu handling
 */

import { useCallback, type MutableRefObject, type RefObject } from 'react';
import { useInteractionState } from '../../../hooks/useInteractionState';
import type {
  InteractionMode,
  SelectionBox,
  DrawingConnector,
  DragData,
  ResizeData,
} from '../../../hooks/useInteractionState';
import { useCanvasPanning } from '../../../hooks/useCanvasPanning';
import { useCanvasLabelEditing } from '../../../hooks/useCanvasLabelEditing';
import { useCanvasSelection } from '../../../hooks/useCanvasSelection';
import { useConnectorDrawing } from '../../../hooks/useConnectorDrawing';
import { useShapeDragging } from '../../../hooks/useShapeDragging';
import { useShapeResizing } from '../../../hooks/useShapeResizing';
import { useShapeInteraction } from '../../../hooks/useShapeInteraction';
import { useCanvasKeyboardHandlers } from '../../../hooks/useCanvasKeyboardHandlers';
import { useCanvasMouseOrchestration } from './useCanvasMouseOrchestration';
import { isContainerType } from '../../../utils/containment-utils';
import { MENU_IDS } from '../../../hooks/useContextMenuManager';
import type { UseContextMenuManagerReturn } from '../../../hooks/useContextMenuManager';
import type { ViewportTransform } from '../../../utils/viewport';
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Connector } from '~/core/entities/design-studio/types/Connector';
import type { DiagramType } from '~/core/entities/design-studio/types/Diagram';
import type { CommandFactory } from '~/core/commands/CommandFactory';
import type { Command } from '~/core/commands/command.types';
import type { ResizeHandle } from '../../../utils/resize';
import type { ConnectorTool } from '~/design-studio/diagrams/bpmn/connectors';
import type { CanvasStateStoreActions, CanvasStateCrudOperations } from './useCanvasState';

export interface UseCanvasEventOrchestratorProps {
  // From useCanvasState
  viewportTransform: ViewportTransform;
  shapes: Shape[];
  connectors: Connector[];
  localShapes: Shape[];
  localConnectors: Connector[];
  selectedShapeIds: string[];
  selectedConnectorIds: string[];
  gridSnappingEnabled: boolean;
  editingEntityId: string | null;
  editingEntityType: 'shape' | 'connector' | null;
  editingOriginalLabel: string | undefined;
  storeActions: CanvasStateStoreActions;
  crudOperations: CanvasStateCrudOperations;
  commandFactory: CommandFactory;

  // Diagram info
  diagramId: string;
  diagramType: DiagramType | undefined;
  entityShapes: Shape[];

  // Refs
  containerRef: RefObject<HTMLDivElement | null>;
  lastMousePosRef: MutableRefObject<{ x: number; y: number }>;

  // Menu manager
  menuManager: UseContextMenuManagerReturn;

  // Connector type management
  connectorTypeManager: {
    getConnectorConfig: (connectorType: string) => ConnectorTool | undefined;
  };
  activeConnectorType: string;

  // Command execution
  executeCommand: (command: Command) => Promise<void>;
}

export interface UseCanvasEventOrchestratorReturn {
  // Interaction state
  mode: InteractionMode;
  selectionBox: SelectionBox | null;
  drawingConnector: DrawingConnector | null;

  // Canvas event handlers
  handleCanvasMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleContextMenu: (e: React.MouseEvent) => void;

  // Shape event handlers
  handleShapeMouseDown: (e: React.MouseEvent, shapeId: string) => void;
  handleShapeMouseEnter: (e: React.MouseEvent, shapeId: string) => void;
  handleShapeMouseLeave: (e: React.MouseEvent, shapeId: string) => void;
  handleShapeDoubleClick: (shapeId: string) => void;
  handleResizeStart: (shapeId: string, handle: ResizeHandle, e: React.MouseEvent) => void;

  // Connector event handlers
  handleConnectorMouseDown: (e: React.MouseEvent, connectorId: string) => void;
  handleConnectorMouseEnter: (e: React.MouseEvent, connectorId: string) => void;
  handleConnectorMouseLeave: (e: React.MouseEvent, connectorId: string) => void;
  handleConnectorDoubleClick: (connectorId: string) => void;
  handleStartDrawingConnector: (connectionPointId: string, e: React.MouseEvent) => void;
  handleFinishDrawingConnector: (connectionPointId: string, e: React.MouseEvent) => Promise<void>;

  // Label editing handlers
  handleLabelChange: (id: string, type: 'shape' | 'connector', label: string) => void;
  handleFinishEditing: () => void;

  // Cursor
  orchestrationCursor: string;
}

export function useCanvasEventOrchestrator({
  viewportTransform,
  shapes,
  connectors,
  localShapes,
  localConnectors,
  selectedShapeIds,
  selectedConnectorIds,
  gridSnappingEnabled,
  editingEntityId,
  editingEntityType,
  editingOriginalLabel,
  storeActions,
  crudOperations,
  commandFactory,
  diagramId,
  diagramType,
  entityShapes,
  containerRef,
  lastMousePosRef,
  menuManager,
  connectorTypeManager,
  activeConnectorType,
  executeCommand,
}: UseCanvasEventOrchestratorProps): UseCanvasEventOrchestratorReturn {
  // Initialize interaction state machine
  const {
    mode,
    data: interactionData,
    reset: resetInteraction,
    startPanning: transitionToPanning,
    startDragging: transitionToDragging,
    updateDragging: updateDraggingData,
    startSelecting: transitionToSelecting,
    updateSelecting: updateSelectingData,
    startDrawingConnector: transitionToDrawingConnector,
    updateDrawingConnector: updateDrawingConnectorData,
    startResizing: transitionToResizing,
    updateResizing: updateResizingData,
  } = useInteractionState();

  // Extract mode-specific data with type safety
  const selectionBox: SelectionBox | null =
    mode === 'selecting' ? (interactionData as SelectionBox) : null;
  const dragData: DragData | null =
    mode === 'dragging-shapes' ? (interactionData as DragData) : null;
  const drawingConnector: DrawingConnector | null =
    mode === 'drawing-connector' ? (interactionData as DrawingConnector) : null;
  const resizeData: ResizeData | null =
    mode === 'resizing-shapes' ? (interactionData as ResizeData) : null;

  // Panning hook
  const { startPanning, updatePanning, stopPanning } = useCanvasPanning({
    viewportTransform,
    lastMousePosRef,
    isActive: mode === 'panning',
  });

  // Label editing hook
  const {
    handleShapeDoubleClick,
    handleConnectorDoubleClick,
    handleLabelChange,
    handleFinishEditing,
  } = useCanvasLabelEditing({
    localShapes,
    localConnectors,
    editingEntityId,
    editingEntityType,
    editingOriginalLabel,
    setEditingEntity: storeActions.setEditingEntity,
    clearEditingEntity: storeActions.clearEditingEntity,
    updateLocalShape: storeActions.updateLocalShape,
    updateLocalConnector: storeActions.updateLocalConnector,
    updateShapeLabel: crudOperations.updateShapeLabel,
    updateConnectorLabel: crudOperations.updateConnectorLabel,
    diagramId,
  });

  // Selection hook
  const {
    startSelection,
    updateSelection,
    finishSelection,
  } = useCanvasSelection({
    containerRef,
    lastMousePosRef,
    viewportTransform,
    shapes,
    connectors,
    clearSelection: storeActions.clearSelection,
    setSelection: storeActions.setSelection,
    isActive: mode === 'selecting',
    selectionBox,
  });

  // Connector drawing hook
  const {
    startDrawingConnector,
    updateDrawingConnector,
    finishDrawingConnector,
  } = useConnectorDrawing({
    containerRef,
    viewportTransform,
    addConnector: crudOperations.addConnector || (async () => {}),
    activeConnectorType,
    getConnectorConfig: connectorTypeManager.getConnectorConfig,
    isActive: mode === 'drawing-connector',
    drawingConnector,
    diagramType,
    shapes: new Map(shapes.map((shape) => [shape.id, shape])),
  });

  // Shape dragging hook
  const {
    startDragging,
    updateDragging,
    finishDragging,
  } = useShapeDragging({
    viewportTransform,
    gridSnappingEnabled,
    localShapes,
    updateLocalShapes: storeActions.updateLocalShapes,
    updateShapes: crudOperations.updateShapes,
    shapes,
    isActive: mode === 'dragging-shapes',
    dragData,
    diagramId,
    commandFactory,
    executeCommand,
    setHoveredContainerId: storeActions.setHoveredContainerId,
  });

  // Shape resizing hook
  const {
    startResizing,
    updateResizing,
    finishResizing,
  } = useShapeResizing({
    viewportTransform,
    gridSnappingEnabled,
    localShapes,
    updateLocalShapes: storeActions.updateLocalShapes,
    updateShapes: crudOperations.updateShapes,
    shapes,
    isActive: mode === 'resizing-shapes',
    resizeData,
    diagramId,
    commandFactory,
    executeCommand,
  });

  // Keyboard handlers
  useCanvasKeyboardHandlers({
    selectedConnectorIds,
    selectedShapeIds,
    deleteConnector: crudOperations.deleteConnector,
    deleteShape: crudOperations.deleteShape,
    deleteConnectors: crudOperations.deleteConnectors,
    deleteShapes: crudOperations.deleteShapes,
    setSelectedConnectors: storeActions.setSelectedConnectors,
    setSelectedShapes: storeActions.setSelectedShapes,
  });

  // Shape interaction hook
  const {
    handleShapeMouseDown,
    handleShapeMouseEnter,
    handleShapeMouseLeave,
  } = useShapeInteraction({
    viewportTransform,
    selectedShapeIds,
    setSelectedShapes: storeActions.setSelectedShapes,
    setHoveredShapeId: storeActions.setHoveredShapeId,
    startDragging,
    onStartDragging: transitionToDragging,
    containerRef,
    lastMousePosRef,
    shapes: entityShapes,
    onShapeRightClick: menuManager.openShapeContextMenu,
  });

  // Handle resize start from resize handles
  const handleResizeStart = useCallback(
    (shapeId: string, handle: ResizeHandle, e: React.MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const { x: canvasX, y: canvasY } = viewportTransform.screenToCanvas(screenX, screenY);

      // Get all selected container shapes to resize together
      const selectedContainers = selectedShapeIds.filter((id) => {
        const shape = shapes.find((s) => s.id === id);
        return shape && isContainerType(shape.type);
      });

      // If the clicked shape is not in selection, resize only that shape
      const shapesToResize = selectedContainers.includes(shapeId)
        ? selectedContainers
        : [shapeId];

      const resizeDataResult = startResizing(canvasX, canvasY, handle, shapesToResize);
      transitionToResizing(resizeDataResult);
    },
    [containerRef, viewportTransform, selectedShapeIds, shapes, startResizing, transitionToResizing]
  );

  // Handle canvas right-click context menu
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();

    const container = containerRef.current;
    if (!container) return;

    // Get click position in screen coordinates
    const rect = container.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    // Convert to canvas coordinates for shape placement
    const { x: canvasX, y: canvasY } = viewportTransform.screenToCanvas(screenX, screenY);

    // Determine which menu to open based on diagram type
    let menuId: string = MENU_IDS.CANVAS_CONTEXT_MENU;
    if (diagramType === 'bpmn') {
      menuId = MENU_IDS.BPMN_TOOLSET_POPOVER;
    } else if (diagramType === 'class') {
      menuId = MENU_IDS.CLASS_TOOLSET_POPOVER;
    } else if (diagramType === 'sequence') {
      menuId = MENU_IDS.SEQUENCE_TOOLSET_POPOVER;
    } else if (diagramType === 'architecture') {
      menuId = MENU_IDS.ARCHITECTURE_TOOLSET_POPOVER;
    } else if (diagramType === 'entity-relationship') {
      menuId = MENU_IDS.ENTITY_RELATIONSHIP_TOOLSET_POPOVER;
    }

    // Open the appropriate menu
    menuManager.openMenu({
      id: menuId,
      screenPosition: { x: event.clientX, y: event.clientY },
      canvasPosition: { x: canvasX, y: canvasY },
    });
  }, [containerRef, viewportTransform, diagramType, menuManager]);

  // Handle connector drag released on canvas (not on connection point)
  // Opens toolset popover for shape creation with pending connector
  const handleReleaseConnectorOnCanvas = useCallback(
    (screenX: number, screenY: number, canvasX: number, canvasY: number) => {
      if (!drawingConnector) return;

      const container = containerRef.current;
      if (!container) return;

      // Get the absolute screen coordinates for the popover
      const rect = container.getBoundingClientRect();
      const absoluteScreenX = rect.left + screenX;
      const absoluteScreenY = rect.top + screenY;

      // Determine which toolset popover to open based on diagram type
      let menuId: string = MENU_IDS.BPMN_TOOLSET_POPOVER;
      if (diagramType === 'class') {
        menuId = MENU_IDS.CLASS_TOOLSET_POPOVER;
      } else if (diagramType === 'sequence') {
        menuId = MENU_IDS.SEQUENCE_TOOLSET_POPOVER;
      } else if (diagramType === 'architecture') {
        menuId = MENU_IDS.ARCHITECTURE_TOOLSET_POPOVER;
      } else if (diagramType === 'entity-relationship') {
        menuId = MENU_IDS.ENTITY_RELATIONSHIP_TOOLSET_POPOVER;
      }

      // Open toolset popover with pending connector information
      // Use absolute screen coordinates for popover positioning
      menuManager.openToolsetPopoverWithConnector(
        menuId,
        absoluteScreenX,
        absoluteScreenY,
        canvasX,
        canvasY,
        {
          sourceShapeId: drawingConnector.fromShapeId,
          sourceConnectionPointId: drawingConnector.fromConnectionPointId,
          sourceDirection: drawingConnector.sourceDirection || 'N',
        }
      );

      // Reset the drawing connector state
      resetInteraction();
    },
    [drawingConnector, diagramType, menuManager, resetInteraction, containerRef]
  );

  // Mouse orchestration hook
  const { handleMouseDown, handleMouseMove, handleMouseUp, cursor: orchestrationCursor } = useCanvasMouseOrchestration({
    containerRef,
    mode,
    selectionBox,
    onStartPanning: transitionToPanning,
    onStartSelecting: transitionToSelecting,
    startPanning,
    updatePanning,
    stopPanning,
    startSelection,
    updateSelection,
    finishSelection,
    onUpdateSelecting: updateSelectingData,
    updateDrawingConnector,
    onUpdateDrawingConnector: updateDrawingConnectorData,
    onCancelDrawingConnector: resetInteraction,
    onReleaseConnectorOnCanvas: handleReleaseConnectorOnCanvas,
    updateDragging,
    finishDragging,
    onUpdateDragging: updateDraggingData,
    onFinishInteraction: resetInteraction,
    updateResizing,
    finishResizing,
    onUpdateResizing: updateResizingData,
    resizeHandle: resizeData?.handle ?? null,
  });

  // Handle canvas mouse down with focus management
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Focus the canvas to enable paste events
      const container = containerRef.current;
      if (container) {
        container.focus();
      }
      handleMouseDown(e);
    },
    [containerRef, handleMouseDown]
  );

  // Wrap connector drawing functions to handle state machine transitions
  const handleStartDrawingConnector = useCallback(
    (connectionPointId: string, e: React.MouseEvent) => {
      const connectorData = startDrawingConnector(connectionPointId, e);
      transitionToDrawingConnector(connectorData);
    },
    [startDrawingConnector, transitionToDrawingConnector]
  );

  const handleFinishDrawingConnector = useCallback(
    async (connectionPointId: string, e: React.MouseEvent) => {
      await finishDrawingConnector(connectionPointId, e);
      resetInteraction();
    },
    [finishDrawingConnector, resetInteraction]
  );

  // Handle connector mouse down for selection
  const handleConnectorMouseDown = useCallback(
    (e: React.MouseEvent, connectorId: string) => {
      e.stopPropagation();

      // Handle right-click for context menu
      if (e.button === 2) {
        e.preventDefault();
        menuManager.openConnectorContextMenu(connectorId, e.clientX, e.clientY);
        return;
      }

      // Only handle left mouse button for selection
      if (e.button !== 0) return;

      // Check for multi-select modifiers (Shift, Ctrl, or Cmd on Mac)
      const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;

      if (isMultiSelect) {
        // Toggle connector in selection
        if (selectedConnectorIds.includes(connectorId)) {
          // Remove from selection
          storeActions.setSelectedConnectors(selectedConnectorIds.filter((id) => id !== connectorId));
        } else {
          // Add to selection
          storeActions.setSelectedConnectors([...selectedConnectorIds, connectorId]);
        }
      } else {
        // If clicking on a non-selected connector, select only that connector
        if (!selectedConnectorIds.includes(connectorId)) {
          storeActions.setSelectedConnectors([connectorId]);
        }
        // If clicking on an already selected connector, keep the current selection
      }
    },
    [selectedConnectorIds, storeActions, menuManager]
  );

  // Handle connector mouse enter for hover state
  const handleConnectorMouseEnter = useCallback(
    (_e: React.MouseEvent, connectorId: string) => {
      storeActions.setHoveredConnectorId(connectorId);
    },
    [storeActions]
  );

  // Handle connector mouse leave for hover state
  const handleConnectorMouseLeave = useCallback(
    (_e: React.MouseEvent, _connectorId: string) => {
      storeActions.setHoveredConnectorId(null);
    },
    [storeActions]
  );

  return {
    // Interaction state
    mode,
    selectionBox,
    drawingConnector,

    // Canvas event handlers
    handleCanvasMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleContextMenu,

    // Shape event handlers
    handleShapeMouseDown,
    handleShapeMouseEnter,
    handleShapeMouseLeave,
    handleShapeDoubleClick,
    handleResizeStart,

    // Connector event handlers
    handleConnectorMouseDown,
    handleConnectorMouseEnter,
    handleConnectorMouseLeave,
    handleConnectorDoubleClick,
    handleStartDrawingConnector,
    handleFinishDrawingConnector,

    // Label editing handlers
    handleLabelChange,
    handleFinishEditing,

    // Cursor
    orchestrationCursor,
  };
}

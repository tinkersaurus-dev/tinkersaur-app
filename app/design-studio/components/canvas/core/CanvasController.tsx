import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useCanvasInstance } from '../../../store/content/useCanvasInstance';
import { useDiagram } from '../../../hooks/useDiagrams';
import { useDiagramCRUD } from '../../../hooks/useDiagramCRUD';
import { useDiagramStore } from '~/core/entities/design-studio';
import { useViewportTransform } from '../../../hooks/useViewportTransform';
import { useCanvasViewport } from '../../../hooks/useCanvasViewport';
import { useCanvasLabelEditing } from '../../../hooks/useCanvasLabelEditing';
import { useInteractionState } from '../../../hooks/useInteractionState';
import { useCanvasPanning } from '../../../hooks/useCanvasPanning';
import { useCanvasSelection } from '../../../hooks/useCanvasSelection';
import { useConnectorDrawing } from '../../../hooks/useConnectorDrawing';
import { useShapeDragging } from '../../../hooks/useShapeDragging';
import { useCanvasKeyboardHandlers } from '../../../hooks/useCanvasKeyboardHandlers';
import { useClassShapeEditing } from '../../../hooks/useClassShapeEditing';
import { useEnumerationShapeEditing } from '../../../hooks/useEnumerationShapeEditing';
import { useShapeInteraction } from '../../../hooks/useShapeInteraction';
import { useCanvasMouseOrchestration } from '../hooks/useCanvasMouseOrchestration';
import { useCanvasPasteHandler } from '../hooks/useCanvasPasteHandler';
import { useConnectorTypeManager } from '../../../hooks/useConnectorTypeManager';
import { useContextMenuManager, MENU_IDS } from '../../../hooks/useContextMenuManager';
import { commandManager } from '~/core/commands/CommandManager';
import type { Command } from '~/core/commands/command.types';
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts';
import { createToolbarButtons } from '../config/toolbarConfig';
import type { Tool as BpmnTool } from '../../../config/bpmn-tools';
import type { Tool as ClassTool } from '../../../config/class-tools';
import type { Tool as SequenceTool } from '../../../config/sequence-tools';
import { getGlobalToolById } from '../../../config/global-tools';
import { useMermaidSync } from '../../../hooks/useMermaidSync';
import { useMermaidViewerStore } from '../../../store/mermaid/mermaidViewerStore';
import { useToolHandler } from '../../../hooks/useToolHandler';
import { mapBpmnToolToShape, mapClassToolToShape, mapSequenceToolToShape, mapGlobalToolToShape } from '../../../utils/toolMappers';
import { CanvasContext } from './CanvasControllerContext';
import type { CanvasControllerContext } from './CanvasControllerContext';
import { DiagramContext } from './CanvasDiagramContext';
import type { CanvasDiagramContext } from './CanvasDiagramContext';
import { ViewportContext } from './CanvasViewportContext';
import type { CanvasViewportContext } from './CanvasViewportContext';
import { SelectionContext } from './CanvasSelectionContext';
import type { CanvasSelectionContext } from './CanvasSelectionContext';
import { EventsContext } from './CanvasEventsContext';
import type { CanvasEventsContext } from './CanvasEventsContext';

/**
 * Canvas Controller Component
 *
 * Orchestrates all business logic, state management, and event handling for the Canvas.
 * Provides state and handlers to child components via CanvasContext.
 *
 * Responsibilities:
 * - Hook composition and coordination
 * - State initialization and synchronization
 * - Event handler creation and delegation
 * - Command execution and CRUD operations
 * - Menu and toolbar management
 */

interface CanvasControllerProps {
  /** The diagram ID for this canvas instance */
  diagramId: string;
  /** Child components that will consume the canvas context */
  children: React.ReactNode;
}

export function CanvasController({ diagramId, children }: CanvasControllerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Track if local state has been initialized from entity store
  const [isInitialized, setIsInitialized] = useState(false);

  // Track if mermaid syntax has been initialized from diagram
  const mermaidInitializedRef = useRef(false);

  // Get persisted canvas data from entity store (need diagram type early for store initialization)
  const { diagram, loading } = useDiagram(diagramId);

  // Get isolated instance store for THIS diagram
  const canvasInstance = useCanvasInstance(diagramId, diagram?.type);

  // Get viewport transform (bundles zoom, panX, panY with transformation methods)
  const viewportTransform = useViewportTransform(canvasInstance);

  // Get instance-specific state
  const selectedShapeIds = canvasInstance((state) => state.selectedShapeIds);
  const hoveredShapeId = canvasInstance((state) => state.hoveredShapeId);
  const selectedConnectorIds = canvasInstance((state) => state.selectedConnectorIds);
  const hoveredConnectorId = canvasInstance((state) => state.hoveredConnectorId);
  const gridSnappingEnabled = canvasInstance((state) => state.gridSnappingEnabled);
  const gridDisplayMode = canvasInstance((state) => state.gridDisplayMode);

  // Get LOCAL editing state (ephemeral, not persisted until commit)
  const localShapes = canvasInstance((state) => state.localShapes);
  const localConnectors = canvasInstance((state) => state.localConnectors);
  const editingEntityId = canvasInstance((state) => state.editingEntityId);
  const editingEntityType = canvasInstance((state) => state.editingEntityType);
  const editingOriginalLabel = canvasInstance((state) => state.editingOriginalLabel);

  // Get instance actions
  const setSelectedShapes = canvasInstance((state) => state.setSelectedShapes);
  const setHoveredShapeId = canvasInstance((state) => state.setHoveredShapeId);
  const setSelectedConnectors = canvasInstance((state) => state.setSelectedConnectors);
  const setSelection = canvasInstance((state) => state.setSelection);
  const setHoveredConnectorId = canvasInstance((state) => state.setHoveredConnectorId);
  const clearSelection = canvasInstance((state) => state.clearSelection);
  const initializeContent = canvasInstance((state) => state.initializeContent);
  const updateLocalShape = canvasInstance((state) => state.updateLocalShape);
  const updateLocalShapes = canvasInstance((state) => state.updateLocalShapes);
  const updateLocalConnector = canvasInstance((state) => state.updateLocalConnector);
  const setEditingEntity = canvasInstance((state) => state.setEditingEntity);
  const clearEditingEntity = canvasInstance((state) => state.clearEditingEntity);
  const setGridSnappingEnabled = canvasInstance((state) => state.setGridSnappingEnabled);
  const setGridDisplayMode = canvasInstance((state) => state.setGridDisplayMode);
  const activeConnectorType = canvasInstance((state) => state.activeConnectorType);
  const setActiveConnectorType = canvasInstance((state) => state.setActiveConnectorType);

  // Get CRUD operations for this diagram
  const { addShape, updateShapes, addConnector, deleteConnector, deleteShape, deleteConnectors, deleteShapes } = useDiagramCRUD(diagramId);
  const commandFactory = useDiagramStore((state) => state.commandFactory);
  const updateShapeLabel = useDiagramStore((state) => state.updateShapeLabel);
  const updateConnectorLabel = useDiagramStore((state) => state.updateConnectorLabel);
  const entityShapes = useMemo(() => diagram?.shapes || [], [diagram?.shapes]);
  const entityConnectors = useMemo(() => diagram?.connectors || [], [diagram?.connectors]);

  // Enable keyboard shortcuts for undo/redo
  useKeyboardShortcuts({ scope: diagramId });

  // Get mouse position helper (for paste import centering)
  const getMousePosition = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return { x: 0, y: 0 };
    }

    // Use last known mouse position in screen coords, or center of viewport
    const rect = container.getBoundingClientRect();
    const screenX = lastMousePosRef.current.x || rect.width / 2;
    const screenY = lastMousePosRef.current.y || rect.height / 2;

    // Convert to canvas coordinates
    return viewportTransform.screenToCanvas(screenX, screenY);
  }, [containerRef, viewportTransform]);

  // Enable paste handler for importing Mermaid diagrams
  useCanvasPasteHandler({
    diagramId,
    diagramType: diagram?.type || 'bpmn',
    commandFactory,
    canvasRef: containerRef,
    getMousePosition,
    enabled: !loading && !!diagram,
  });

  // Use custom hooks for viewport, panning, and label editing
  useCanvasViewport({
    containerRef,
    viewportTransform,
  });

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
  } = useInteractionState();

  // Extract mode-specific data with type safety
  const selectionBox: import('../../../hooks/useInteractionState').SelectionBox | null =
    mode === 'selecting' ? (interactionData as import('../../../hooks/useInteractionState').SelectionBox) : null;
  const dragData: import('../../../hooks/useInteractionState').DragData | null =
    mode === 'dragging-shapes' ? (interactionData as import('../../../hooks/useInteractionState').DragData) : null;
  const drawingConnector: import('../../../hooks/useInteractionState').DrawingConnector | null =
    mode === 'drawing-connector' ? (interactionData as import('../../../hooks/useInteractionState').DrawingConnector) : null;

  const { startPanning, updatePanning, stopPanning } = useCanvasPanning({
    viewportTransform,
    lastMousePosRef,
    isActive: mode === 'panning',
  });

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
    setEditingEntity,
    clearEditingEntity,
    updateLocalShape,
    updateLocalConnector,
    updateShapeLabel,
    updateConnectorLabel,
    diagramId,
  });

  // Helper function to get a shape by ID from local shapes
  const getShape = useCallback(
    (shapeId: string) => {
      return localShapes.find((s) => s.id === shapeId);
    },
    [localShapes]
  );

  // Helper function to execute commands
  const executeCommand = useCallback(
    async (command: Command) => {
      await commandManager.execute(command, diagramId);
    },
    [diagramId]
  );

  // Class shape editing hook
  const {
    updateStereotype,
    addAttribute,
    deleteAttribute,
    updateAttribute,
    updateAttributeLocal,
    addMethod,
    deleteMethod,
    updateMethod,
    updateMethodLocal,
  } = useClassShapeEditing({
    diagramId,
    commandFactory,
    getShape,
    updateLocalShape,
    executeCommand,
  });

  // Enumeration shape editing hook
  const {
    addLiteral,
    deleteLiteral,
    updateLiteral,
    updateLiteralLocal,
  } = useEnumerationShapeEditing({
    diagramId,
    commandFactory,
    getShape,
    updateLocalShape,
    executeCommand,
  });

  // Mermaid sync hook - automatically generates mermaid syntax from committed shapes/connectors
  // Also persists the mermaid syntax to the diagram object for reuse across the app
  useMermaidSync({
    shapes: entityShapes,
    connectors: entityConnectors,
    diagramType: diagram?.type,
    diagramId,
    enabled: true,
  });

  // Initialize mermaid viewer with persisted syntax when diagram first loads
  // Only run ONCE per diagram to avoid conflicts with auto-generation
  const setSyntax = useMermaidViewerStore((state) => state.setSyntax);
  useEffect(() => {
    if (diagram && !mermaidInitializedRef.current) {
      if (diagram.mermaidSyntax) {
        setSyntax(diagram.mermaidSyntax);
      }
      mermaidInitializedRef.current = true;
    }
  }, [diagram, setSyntax]);

  // Reset mermaid initialization flag when diagram ID changes
  useEffect(() => {
    mermaidInitializedRef.current = false;
  }, [diagramId]);

  // Track lengths to avoid unnecessary effect re-runs from array reference changes
  const entityShapesLength = entityShapes.length;
  const entityConnectorsLength = entityConnectors.length;

  // Initialize local content from entity store ONCE on mount
  // After initialization, local state is autonomous and updated by commands
  // Commands coordinate updates to both local state and entity store
  useEffect(() => {
    if (!loading && (entityShapesLength > 0 || entityConnectorsLength > 0) && !isInitialized) {
      // Use requestAnimationFrame to defer state update
      const frameId = requestAnimationFrame(() => {
        initializeContent(entityShapes, entityConnectors);
        setIsInitialized(true);
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [loading, entityShapesLength, entityConnectorsLength, initializeContent, isInitialized, entityShapes, entityConnectors]);

  // Render from local state (working copy), fallback to entity state if local not initialized
  // Use useMemo to avoid unnecessary reference changes when switching between local and entity state
  const shapes = useMemo(
    () => (localShapes.length > 0 ? localShapes : entityShapes),
    [localShapes, entityShapes]
  );
  const connectors = useMemo(
    () => (localConnectors.length > 0 ? localConnectors : entityConnectors),
    [localConnectors, entityConnectors]
  );

  // Use connector type manager hook for all connector type management
  const connectorTypeManager = useConnectorTypeManager({
    diagramId,
    diagramType: diagram?.type,
    activeConnectorType,
    setActiveConnectorType,
    commandFactory,
    connectors,
  });

  // Use unified context menu manager for all menus/popovers
  const menuManager = useContextMenuManager();

  // Use polymorphic tool handlers for BPMN, Class, and Sequence diagrams
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

  // Use Phase 2 hooks
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
    clearSelection,
    setSelection,
    isActive: mode === 'selecting',
    selectionBox,
  });

  const {
    startDrawingConnector,
    updateDrawingConnector,
    finishDrawingConnector,
  } = useConnectorDrawing({
    containerRef,
    viewportTransform,
    addConnector: addConnector || (async () => {}),
    activeConnectorType,
    getConnectorConfig: connectorTypeManager.getConnectorConfig,
    isActive: mode === 'drawing-connector',
    drawingConnector,
    diagramType: diagram?.type,
    shapes: new Map(shapes.map((shape) => [shape.id, shape])),
  });

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
    if (diagram?.type === 'bpmn') {
      menuId = MENU_IDS.BPMN_TOOLSET_POPOVER;
    } else if (diagram?.type === 'class') {
      menuId = MENU_IDS.CLASS_TOOLSET_POPOVER;
    } else if (diagram?.type === 'sequence') {
      menuId = MENU_IDS.SEQUENCE_TOOLSET_POPOVER;
    }

    // Open the appropriate menu
    menuManager.openMenu({
      id: menuId,
      screenPosition: { x: event.clientX, y: event.clientY },
      canvasPosition: { x: canvasX, y: canvasY },
    });
  }, [containerRef, viewportTransform, diagram?.type, menuManager]);

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

  const {
    startDragging,
    updateDragging,
    finishDragging,
  } = useShapeDragging({
    viewportTransform,
    gridSnappingEnabled,
    localShapes,
    updateLocalShapes,
    updateShapes,
    shapes,
    isActive: mode === 'dragging-shapes',
    dragData,
  });

  useCanvasKeyboardHandlers({
    selectedConnectorIds,
    selectedShapeIds,
    deleteConnector,
    deleteShape,
    deleteConnectors,
    deleteShapes,
    setSelectedConnectors,
    setSelectedShapes,
  });

  // Use shape interaction hook for selection and drag initialization
  const {
    handleShapeMouseDown,
    handleShapeMouseEnter,
    handleShapeMouseLeave,
  } = useShapeInteraction({
    viewportTransform,
    selectedShapeIds,
    setSelectedShapes,
    setHoveredShapeId,
    startDragging,
    onStartDragging: transitionToDragging,
    containerRef,
    lastMousePosRef,
    shapes: diagram?.shapes ?? [],
  });

  // Handle connector drag released on canvas (not on connection point)
  // Opens toolset popover for shape creation with pending connector
  // IMPORTANT: Must be defined before useCanvasMouseOrchestration
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
      if (diagram?.type === 'class') {
        menuId = MENU_IDS.CLASS_TOOLSET_POPOVER;
      } else if (diagram?.type === 'sequence') {
        menuId = MENU_IDS.SEQUENCE_TOOLSET_POPOVER;
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
    [drawingConnector, diagram?.type, menuManager, resetInteraction, containerRef]
  );

  // Orchestrate mouse events with state machine-based routing
  const { handleMouseDown, handleMouseMove, handleMouseUp } = useCanvasMouseOrchestration({
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
  });

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
          setSelectedConnectors(selectedConnectorIds.filter((id) => id !== connectorId));
        } else {
          // Add to selection
          setSelectedConnectors([...selectedConnectorIds, connectorId]);
        }
      } else {
        // If clicking on a non-selected connector, select only that connector
        if (!selectedConnectorIds.includes(connectorId)) {
          setSelectedConnectors([connectorId]);
        }
        // If clicking on an already selected connector, keep the current selection
      }
    },
    [selectedConnectorIds, setSelectedConnectors, menuManager]
  );

  // Handle connector mouse enter for hover state
  const handleConnectorMouseEnter = useCallback(
    (e: React.MouseEvent, connectorId: string) => {
      setHoveredConnectorId(connectorId);
    },
    [setHoveredConnectorId]
  );

  // Handle connector mouse leave for hover state
  const handleConnectorMouseLeave = useCallback(
    (_e: React.MouseEvent, _connectorId: string) => {
      setHoveredConnectorId(null);
    },
    [setHoveredConnectorId]
  );

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
      diagramType: diagram?.type,
      gridSnappingEnabled,
      gridDisplayMode,
      activeConnectorIcon: connectorTypeManager.activeConnectorIcon,
      zoom: viewportTransform.viewport.zoom,
      setGridSnappingEnabled,
      setGridDisplayMode,
      handleConnectorToolbarClick,
      handleZoomReset,
    }),
    [diagram?.type, connectorTypeManager.activeConnectorIcon, handleConnectorToolbarClick, handleZoomReset, gridSnappingEnabled, gridDisplayMode, viewportTransform.viewport.zoom, setGridSnappingEnabled, setGridDisplayMode]
  );

  // Build individual context values
  const diagramContextValue: CanvasDiagramContext = useMemo(() => ({
    diagramId,
    diagram,
    loading,
    shapes,
    connectors,
  }), [diagramId, diagram, loading, shapes, connectors]);

  const viewportContextValue: CanvasViewportContext = useMemo(() => ({
    viewportTransform,
  }), [viewportTransform]);

  const selectionContextValue: CanvasSelectionContext = useMemo(() => ({
    selectedShapeIds,
    hoveredShapeId,
    selectedConnectorIds,
    hoveredConnectorId,
    mode,
    selectionBox,
    drawingConnector,
    editingEntityId,
    editingEntityType,
    gridSnappingEnabled,
    gridDisplayMode,
    activeConnectorType,
  }), [
    selectedShapeIds,
    hoveredShapeId,
    selectedConnectorIds,
    hoveredConnectorId,
    mode,
    selectionBox,
    drawingConnector,
    editingEntityId,
    editingEntityType,
    gridSnappingEnabled,
    gridDisplayMode,
    activeConnectorType,
  ]);

  const eventsContextValue: CanvasEventsContext = useMemo(() => ({
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
    handleConnectorToolbarClick,
    connectorTypeManager,
    toolbarButtons,
    containerRef,
  }), [
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
    handleConnectorToolbarClick,
    connectorTypeManager,
    toolbarButtons,
    containerRef,
  ]);

  // Build legacy context value (for backwards compatibility)
  const contextValue: CanvasControllerContext = useMemo(() => ({
    // Diagram Data
    diagramId,
    diagram,
    loading,

    // Viewport
    viewportTransform,

    // Content
    shapes,
    connectors,

    // Selection & Interaction
    selectedShapeIds,
    hoveredShapeId,
    selectedConnectorIds,
    hoveredConnectorId,
    mode,
    selectionBox,
    drawingConnector,

    // Editing State
    editingEntityId,
    editingEntityType,
    gridSnappingEnabled,
    activeConnectorType,

    // Event Handlers - Canvas
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleContextMenu,

    // Event Handlers - Shapes
    handleShapeMouseDown,
    handleShapeMouseEnter,
    handleShapeMouseLeave,
    handleShapeDoubleClick,
    handleStartDrawingConnector,
    handleFinishDrawingConnector,

    // Event Handlers - Connectors
    handleConnectorMouseDown,
    handleConnectorMouseEnter,
    handleConnectorMouseLeave,
    handleConnectorDoubleClick,

    // Event Handlers - Editing
    handleLabelChange,
    handleFinishEditing,

    // Event Handlers - Class Shapes
    updateStereotype,
    addAttribute,
    deleteAttribute,
    updateAttribute,
    updateAttributeLocal,
    addMethod,
    deleteMethod,
    updateMethod,
    updateMethodLocal,

    // Menu Management
    menuManager,
    handleAddRectangle,
    handleBpmnToolSelect,
    handleClassToolSelect,
    handleSequenceToolSelect,
    handleConnectorToolbarClick,

    // Connector Type Management
    connectorTypeManager,

    // Toolbar Configuration
    toolbarButtons,

    // Refs
    containerRef,
  }), [
    diagramId,
    diagram,
    loading,
    viewportTransform,
    shapes,
    connectors,
    selectedShapeIds,
    hoveredShapeId,
    selectedConnectorIds,
    hoveredConnectorId,
    mode,
    selectionBox,
    drawingConnector,
    editingEntityId,
    editingEntityType,
    gridSnappingEnabled,
    activeConnectorType,
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
    menuManager,
    handleAddRectangle,
    handleBpmnToolSelect,
    handleClassToolSelect,
    handleSequenceToolSelect,
    handleConnectorToolbarClick,
    connectorTypeManager,
    toolbarButtons,
    containerRef,
  ]);

  return (
    <DiagramContext.Provider value={diagramContextValue}>
      <ViewportContext.Provider value={viewportContextValue}>
        <SelectionContext.Provider value={selectionContextValue}>
          <EventsContext.Provider value={eventsContextValue}>
            <CanvasContext.Provider value={contextValue}>
              {children}
            </CanvasContext.Provider>
          </EventsContext.Provider>
        </SelectionContext.Provider>
      </ViewportContext.Provider>
    </DiagramContext.Provider>
  );
}

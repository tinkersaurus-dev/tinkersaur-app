import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useCanvasInstance } from '../../store/content/useCanvasInstance';
import { useDiagram } from '../../hooks/useDiagrams';
import { useDiagramCRUD } from '../../hooks/useDiagramCRUD';
import { useDesignStudioEntityStore } from '~/core/entities/design-studio';
import { useViewportTransform } from '../../hooks/useViewportTransform';
import { useCanvasViewport } from '../../hooks/useCanvasViewport';
import { useCanvasLabelEditing } from '../../hooks/useCanvasLabelEditing';
import { useInteractionState } from '../../hooks/useInteractionState';
import { useCanvasPanning } from '../../hooks/useCanvasPanning';
import { useCanvasSelection } from '../../hooks/useCanvasSelection';
import { useConnectorDrawing } from '../../hooks/useConnectorDrawing';
import { useShapeDragging } from '../../hooks/useShapeDragging';
import { useCanvasKeyboardHandlers } from '../../hooks/useCanvasKeyboardHandlers';
import { useClassShapeEditing } from '../../hooks/useClassShapeEditing';
import { useShapeInteraction } from '../../hooks/useShapeInteraction';
import { useCanvasMouseOrchestration } from './useCanvasMouseOrchestration';
import { useConnectorTypeManager } from '../../hooks/useConnectorTypeManager';
import { useContextMenuManager, MENU_IDS } from '../../hooks/useContextMenuManager';
import { commandManager } from '~/core/commands/CommandManager';
import type { Command } from '~/core/commands/command.types';
import { GridBackground } from './GridBackground';
import { ContextMenu } from './ContextMenu';
import { BpmnToolsetPopover } from './BpmnToolsetPopover';
import { ClassToolsetPopover } from './ClassToolsetPopover';
import { ConnectorToolsetPopover } from './ConnectorToolsetPopover';
import { ConnectorContextMenu } from './ConnectorContextMenu';
import { CanvasDebugInfo } from './CanvasDebugInfo';
import { ConnectorDrawingPreview } from './ConnectorDrawingPreview';
import { CanvasShapesList } from './CanvasShapesList';
import { CanvasConnectorsList } from './CanvasConnectorsList';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import CanvasToolbar from '../toolbar/CanvasToolbar';
import CanvasTextToolbar from '../toolbar/CanvasTextToolbar';
import { createToolbarButtons } from './toolbarConfig';
import type { Tool as BpmnTool } from '../../config/bpmn-tools';
import type { Tool as ClassTool } from '../../config/class-tools';
import { useMermaidSync } from '../../hooks/useMermaidSync';
import { MermaidViewer } from '../mermaid/MermaidViewer';
import { useToolHandler } from '../../hooks/useToolHandler';
import { mapBpmnToolToShape, mapClassToolToShape } from '../../utils/toolMappers';

/**
 * Canvas Component
 *
 * Main canvas component for diagram editing.
 *
 * Features:
 * - Infinite dot grid background
 * - Pan with middle mouse button
 * - Zoom with mouse wheel (0.1x - 5x)
 * - Right-click context menu to add shapes
 * - Click selection with Shift/Ctrl multi-select
 * - Box selection by dragging on empty canvas
 * - Per-instance state isolation (supports multiple open diagrams)
 *
 * CRITICAL: Each diagram ID gets its own isolated store instance.
 * This component can be rendered multiple times with different diagramIds
 * without any state cross-contamination.
 */

interface CanvasProps {
  /** The diagram ID for this canvas instance */
  diagramId: string;
}

export function Canvas({ diagramId }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Track if local state has been initialized from entity store
  const [isInitialized, setIsInitialized] = useState(false);

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
  const activeConnectorType = canvasInstance((state) => state.activeConnectorType);
  const setActiveConnectorType = canvasInstance((state) => state.setActiveConnectorType);

  // Get CRUD operations for this diagram
  const { addShape, updateShapes, addConnector, deleteConnector, deleteShape, deleteConnectors, deleteShapes } = useDiagramCRUD(diagramId);
  const commandFactory = useDesignStudioEntityStore((state) => state.commandFactory);
  const updateShapeLabel = useDesignStudioEntityStore((state) => state.updateShapeLabel);
  const updateConnectorLabel = useDesignStudioEntityStore((state) => state.updateConnectorLabel);
  const entityShapes = useMemo(() => diagram?.shapes || [], [diagram?.shapes]);
  const entityConnectors = useMemo(() => diagram?.connectors || [], [diagram?.connectors]);

  // Enable keyboard shortcuts for undo/redo
  useKeyboardShortcuts({ scope: diagramId });

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
  const selectionBox: import('../../hooks/useInteractionState').SelectionBox | null =
    mode === 'selecting' ? (interactionData as import('../../hooks/useInteractionState').SelectionBox) : null;
  const dragData: import('../../hooks/useInteractionState').DragData | null =
    mode === 'dragging-shapes' ? (interactionData as import('../../hooks/useInteractionState').DragData) : null;
  const drawingConnector: import('../../hooks/useInteractionState').DrawingConnector | null =
    mode === 'drawing-connector' ? (interactionData as import('../../hooks/useInteractionState').DrawingConnector) : null;

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

  // Mermaid sync hook - automatically generates mermaid syntax from committed shapes/connectors
  useMermaidSync({
    shapes: entityShapes,
    connectors: entityConnectors,
    diagramType: diagram?.type,
    enabled: true,
  });

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
  const shapes = localShapes.length > 0 ? localShapes : entityShapes;
  const connectors = localConnectors.length > 0 ? localConnectors : entityConnectors;

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

  // Use polymorphic tool handlers for BPMN and Class diagrams
  const { handleToolSelect: handleBpmnToolSelect } = useToolHandler<BpmnTool>({
    addShape,
    menuManager,
    toolToShapeMapper: mapBpmnToolToShape,
  });

  const { handleToolSelect: handleClassToolSelect } = useToolHandler<ClassTool>({
    addShape,
    menuManager,
    toolToShapeMapper: mapClassToolToShape,
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
  });

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
  const handleConnectorToolbarClick = useCallback(() => {
    menuManager.openConnectorToolbarPopover();
  }, [menuManager]);

  // Configure toolbar buttons
  const toolbarButtons = useMemo(() =>
    createToolbarButtons({
      diagramType: diagram?.type,
      gridSnappingEnabled,
      activeConnectorIcon: connectorTypeManager.activeConnectorIcon,
      setGridSnappingEnabled,
      handleConnectorToolbarClick,
    }),
    [diagram?.type, connectorTypeManager.activeConnectorIcon, handleConnectorToolbarClick, gridSnappingEnabled, setGridSnappingEnabled]
  );

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
      className="relative w-full h-full overflow-hidden bg-[var(--bg-light)]"
      onMouseDown={handleMouseDown}
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

      {/* Canvas Toolbar - There is an error appearing here, this is realted to a Record<string, unknown> in the menumanager I think. The unknown needs to be converted into a union type of string, number, anb boolean.*/}
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
    </div>
  );
}

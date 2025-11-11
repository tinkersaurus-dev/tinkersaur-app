import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useCanvasInstance } from '../../store/content/useCanvasInstance';
import { useDiagram } from '../../hooks/useDiagrams';
import { useDiagramCRUD } from '../../hooks/useDiagramCRUD';
import { useDesignStudioEntityStore } from '~/core/entities/design-studio';
import { useCanvasViewport } from '../../hooks/useCanvasViewport';
import { useCanvasLabelEditing } from '../../hooks/useCanvasLabelEditing';
import { useCanvasPanning } from '../../hooks/useCanvasPanning';
import { useCanvasSelection } from '../../hooks/useCanvasSelection';
import { useConnectorDrawing } from '../../hooks/useConnectorDrawing';
import { useCanvasContextMenu } from '../../hooks/useCanvasContextMenu';
import { useShapeDragging } from '../../hooks/useShapeDragging';
import { useCanvasKeyboardHandlers } from '../../hooks/useCanvasKeyboardHandlers';
import { useClassShapeEditing } from '../../hooks/useClassShapeEditing';
import { useShapeInteraction } from '../../hooks/useShapeInteraction';
import { useCanvasMouseOrchestration } from './useCanvasMouseOrchestration';
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
import type { ToolbarButton } from '../toolbar/CanvasToolbar';
import { TbGridDots, TbArrowRight } from 'react-icons/tb';
import type { Tool as BpmnTool } from '../../config/bpmn-tools';
import type { Tool as ClassTool } from '../../config/class-tools';
import { useMermaidSync } from '../../hooks/useMermaidSync';
import { MermaidViewer } from '../mermaid/MermaidViewer';
import {
  allBpmnConnectorTools,
  getBpmnConnectorToolByType,
  type ConnectorTool,
} from '../../config/bpmn-connectors';
import {
  allClassConnectorTools,
  getClassConnectorToolByType,
} from '../../config/class-connectors';
import type { Connector } from '~/core/entities/design-studio/types/Connector';

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

  // Get instance-specific state
  const zoom = canvasInstance((state) => state.viewportZoom);
  const panX = canvasInstance((state) => state.viewportPanX);
  const panY = canvasInstance((state) => state.viewportPanY);
  const selectedShapeIds = canvasInstance((state) => state.selectedShapeIds);
  const hoveredShapeId = canvasInstance((state) => state.hoveredShapeId);
  const selectedConnectorIds = canvasInstance((state) => state.selectedConnectorIds);
  const hoveredConnectorId = canvasInstance((state) => state.hoveredConnectorId);
  const isContextMenuOpen = canvasInstance((state) => state.isContextMenuOpen);
  const contextMenuPosition = canvasInstance((state) => state.contextMenuPosition);
  const gridSnappingEnabled = canvasInstance((state) => state.gridSnappingEnabled);

  // Local state for context menu canvas coordinates (to avoid ref access during render)
  const [contextMenuCanvasPos, setContextMenuCanvasPos] = useState<{ canvasX: number; canvasY: number } | null>(null);

  // Get LOCAL editing state (ephemeral, not persisted until commit)
  const localShapes = canvasInstance((state) => state.localShapes);
  const localConnectors = canvasInstance((state) => state.localConnectors);
  const editingEntityId = canvasInstance((state) => state.editingEntityId);
  const editingEntityType = canvasInstance((state) => state.editingEntityType);
  const editingOriginalLabel = canvasInstance((state) => state.editingOriginalLabel);

  // Get instance actions
  const setViewport = canvasInstance((state) => state.setViewport);
  const openContextMenu = canvasInstance((state) => state.openContextMenu);
  const closeContextMenu = canvasInstance((state) => state.closeContextMenu);
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

  // Local state for connector toolbar popover
  const [isConnectorPopoverOpen, setIsConnectorPopoverOpen] = useState(false);
  const [connectorPopoverPosition, setConnectorPopoverPosition] = useState<{ x: number; y: number } | null>(null);

  // Local state for connector context menu (right-click on connector)
  const [isConnectorContextMenuOpen, setIsConnectorContextMenuOpen] = useState(false);
  const [connectorContextMenuPosition, setConnectorContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [rightClickedConnectorId, setRightClickedConnectorId] = useState<string | null>(null);

  // Get CRUD operations for this diagram
  const { addShape, updateShapes, addConnector, deleteConnector, deleteShape } = useDiagramCRUD(diagramId);
  const updateShape = useDesignStudioEntityStore((state) => state._internalUpdateShape);
  const updateShapeLabel = useDesignStudioEntityStore((state) => state.updateShapeLabel);
  const updateConnectorLabel = useDesignStudioEntityStore((state) => state.updateConnectorLabel);
  const entityShapes = useMemo(() => diagram?.shapes || [], [diagram?.shapes]);
  const entityConnectors = useMemo(() => diagram?.connectors || [], [diagram?.connectors]);

  // Enable keyboard shortcuts for undo/redo
  useKeyboardShortcuts({ scope: diagramId });

  // Use custom hooks for viewport, panning, and label editing
  useCanvasViewport({
    containerRef,
    zoom,
    panX,
    panY,
    setViewport,
  });

  const { isPanning, startPanning, updatePanning, stopPanning } = useCanvasPanning({
    setViewport,
    zoom,
    panX,
    panY,
    lastMousePosRef,
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
    updateShape,
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

  // Use Phase 2 hooks
  const {
    selectionBox,
    isSelectingRef,
    startSelection,
    updateSelection,
    finishSelection,
  } = useCanvasSelection({
    containerRef,
    lastMousePosRef,
    zoom,
    panX,
    panY,
    shapes,
    connectors,
    clearSelection,
    setSelection,
  });

  // Helper function to get connector config based on diagram type
  const getConnectorConfig = useCallback((connectorType: string) => {
    if (diagram?.type === 'bpmn') {
      return getBpmnConnectorToolByType(connectorType);
    } else if (diagram?.type === 'class') {
      return getClassConnectorToolByType(connectorType);
    }
    return undefined;
  }, [diagram?.type]);

  const {
    drawingConnector,
    startDrawingConnector,
    updateDrawingConnector,
    finishDrawingConnector,
    cancelDrawingConnector,
  } = useConnectorDrawing({
    containerRef,
    zoom,
    panX,
    panY,
    addConnector: addConnector || (async () => {}),
    activeConnectorType,
    getConnectorConfig,
  });

  const { handleContextMenu, handleAddRectangle } = useCanvasContextMenu({
    containerRef,
    zoom,
    panX,
    panY,
    openContextMenu,
    addShape: addShape || (async () => {}),
    setContextMenuCanvasPos,
  });

  // Handle BPMN tool selection
  const handleBpmnToolSelect = useCallback(async (tool: BpmnTool, canvasX: number, canvasY: number) => {
    if (!addShape) return;

    // Create shape from tool at the clicked position
    await addShape({
      type: tool.shapeType,
      subtype: tool.shapeSubtype,
      x: canvasX - tool.defaultSize.width / 2,
      y: canvasY - tool.defaultSize.height / 2,
      width: tool.defaultSize.width,
      height: tool.defaultSize.height,
      label: tool.name,
      zIndex: 0,
      locked: false,
    });
  }, [addShape]);

  // Handle Class tool selection
  const handleClassToolSelect = useCallback(async (tool: ClassTool, canvasX: number, canvasY: number) => {
    if (!addShape) return;

    // Create shape from tool at the clicked position with initial data
    await addShape({
      type: tool.shapeType,
      subtype: tool.shapeSubtype,
      x: canvasX - tool.defaultSize.width / 2,
      y: canvasY - tool.defaultSize.height / 2,
      width: tool.defaultSize.width,
      height: tool.defaultSize.height,
      label: tool.name,
      zIndex: 0,
      locked: false,
      data: tool.initialData,
    });
  }, [addShape]);

  const {
    isDraggingShapesRef,
    dragStartCanvasPosRef,
    startDragging,
    updateDragging,
    finishDragging,
  } = useShapeDragging({
    zoom,
    panX,
    panY,
    gridSnappingEnabled,
    localShapes,
    updateLocalShapes,
    updateShapes,
    _selectedShapeIds: selectedShapeIds,
    _setSelectedShapes: setSelectedShapes,
    shapes,
    _lastMousePosRef: lastMousePosRef,
  });

  useCanvasKeyboardHandlers({
    selectedConnectorIds,
    selectedShapeIds,
    deleteConnector,
    deleteShape,
    setSelectedConnectors,
    setSelectedShapes,
  });

  // Use shape interaction hook for selection and drag initialization
  const {
    handleShapeMouseDown,
    handleShapeMouseEnter,
    handleShapeMouseLeave,
  } = useShapeInteraction({
    zoom,
    panX,
    panY,
    selectedShapeIds,
    setSelectedShapes,
    setHoveredShapeId,
    startDragging,
    containerRef,
    lastMousePosRef,
  });

  // Orchestrate mouse events with priority-based routing
  const { handleMouseDown, handleMouseMove, handleMouseUp } = useCanvasMouseOrchestration({
    containerRef,
    isPanning,
    startPanning,
    updatePanning,
    stopPanning,
    selectionBox,
    isSelectingRef,
    startSelection,
    updateSelection,
    finishSelection,
    drawingConnector,
    updateDrawingConnector,
    cancelDrawingConnector,
    isDraggingShapesRef,
    dragStartCanvasPosRef,
    updateDragging,
    finishDragging,
  });

  // Handle connector mouse down for selection
  const handleConnectorMouseDown = useCallback(
    (e: React.MouseEvent, connectorId: string) => {
      e.stopPropagation();

      // Handle right-click for context menu
      if (e.button === 2) {
        e.preventDefault();
        setRightClickedConnectorId(connectorId);
        setConnectorContextMenuPosition({ x: e.clientX, y: e.clientY });
        setIsConnectorContextMenuOpen(true);
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
    [selectedConnectorIds, setSelectedConnectors]
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

  // Get available connector tools based on diagram type
  const availableConnectorTools = useMemo(() => {
    if (diagram?.type === 'bpmn') {
      return allBpmnConnectorTools;
    } else if (diagram?.type === 'class') {
      return allClassConnectorTools;
    }
    return [];
  }, [diagram?.type]);

  // Get active connector tool icon
  const activeConnectorIcon = useMemo(() => {
    const activeConnector = getConnectorConfig(activeConnectorType);
    if (activeConnector) {
      const Icon = activeConnector.icon;
      return <Icon size={16} />;
    }
    return <TbArrowRight size={16} />;
  }, [activeConnectorType, getConnectorConfig]);

  // Handle connector toolbar button click
  const handleConnectorToolbarClick = useCallback(() => {
    // Position the popover at the bottom of the screen (where the toolbar is)
    // We can't get the button position without the event, so we'll position it centered at the bottom
    setConnectorPopoverPosition({
      x: window.innerWidth / 2 - 100, // Center approximately (popover is about 200px wide)
      y: window.innerHeight - 100, // Near bottom where toolbar is
    });
    setIsConnectorPopoverOpen(true);
  }, []);

  // Handle closing connector popover
  const handleCloseConnectorPopover = useCallback(() => {
    setIsConnectorPopoverOpen(false);
  }, []);

  // Handle closing connector context menu
  const handleCloseConnectorContextMenu = useCallback(() => {
    setIsConnectorContextMenuOpen(false);
    setRightClickedConnectorId(null);
  }, []);

  // Handle connector selection from popover (for toolbar)
  const handleConnectorSelect = useCallback((connectorTool: ConnectorTool) => {
    setActiveConnectorType(connectorTool.connectorType);
  }, [setActiveConnectorType]);

  // Handle connector type change from context menu (for existing connectors)
  const handleConnectorTypeChange = useCallback(async (connectorTool: ConnectorTool) => {
    if (!rightClickedConnectorId) return;

    // Import the command dynamically to avoid circular dependencies
    const { ChangeConnectorTypeCommand } = await import('~/core/commands/canvas/ChangeConnectorTypeCommand');

    // Get the connector store functions
    const updateConnectorFn = useDesignStudioEntityStore.getState()._internalUpdateConnector;
    const getConnectorFn = (diagramId: string, connectorId: string) => {
      const diagram = useDesignStudioEntityStore.getState().diagrams[diagramId];
      return diagram?.connectors.find((c: Connector) => c.id === connectorId) || null;
    };

    // Create the update data based on the connector tool config
    const updateData = {
      id: rightClickedConnectorId,
      type: connectorTool.connectorType,
      style: connectorTool.style,
      markerStart: connectorTool.markerStart,
      markerEnd: connectorTool.markerEnd,
      lineType: connectorTool.lineType,
      arrowType: connectorTool.markerEnd, // For backwards compatibility
    };

    // Create and execute the command
    const command: Command = new ChangeConnectorTypeCommand(
      diagramId,
      rightClickedConnectorId,
      updateData,
      updateConnectorFn,
      getConnectorFn,
      updateLocalConnector // Pass local state updater for immediate visual feedback
    );

    await commandManager.execute(command, diagramId);
  }, [rightClickedConnectorId, diagramId, updateLocalConnector]);

  // Configure toolbar buttons
  const toolbarButtons: ToolbarButton[] = useMemo(() => {
    const buttons: ToolbarButton[] = [];

    // Only show connector button for BPMN and Class diagrams
    if (diagram?.type === 'bpmn' || diagram?.type === 'class') {
      buttons.push({
        id: 'connector-type',
        icon: activeConnectorIcon,
        onClick: handleConnectorToolbarClick,
        tooltip: 'Select connector type',
        active: false,
      });
    }

    buttons.push({
      id: 'grid-snap',
      icon: <TbGridDots size={16} />,
      onClick: () => setGridSnappingEnabled(!gridSnappingEnabled),
      tooltip: gridSnappingEnabled ? 'Disable grid snapping' : 'Enable grid snapping (10px)',
      active: gridSnappingEnabled,
    });

    return buttons;
  }, [diagram?.type, activeConnectorIcon, handleConnectorToolbarClick, gridSnappingEnabled, setGridSnappingEnabled]);

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
        cursor: isPanning ? 'grabbing' : 'default',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Grid Layer (screen space, no transform) */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full">
          <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
            <GridBackground gridSize={10} />
          </g>
        </svg>
      </div>

      {/* Unified Canvas Content - All elements as direct children */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Render all shapes */}
        <CanvasShapesList
          shapes={shapes}
          selectedShapeIds={selectedShapeIds}
          hoveredShapeId={hoveredShapeId}
          zoom={zoom}
          editingEntityId={editingEntityId}
          editingEntityType={editingEntityType}
          onMouseDown={handleShapeMouseDown}
          onMouseEnter={handleShapeMouseEnter}
          onMouseLeave={handleShapeMouseLeave}
          onDoubleClick={handleShapeDoubleClick}
          onLabelChange={handleLabelChange}
          onFinishEditing={handleFinishEditing}
          onConnectionPointMouseDown={startDrawingConnector}
          onConnectionPointMouseUp={finishDrawingConnector}
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
          zoom={zoom}
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
            zoom={zoom}
          />
        )}
      </div>

      {/* Context menu / Toolset popover (rendered in screen space, not transformed) */}
      {isContextMenuOpen && contextMenuPosition && contextMenuCanvasPos && diagram?.type === 'bpmn' && (
        <BpmnToolsetPopover
          x={contextMenuPosition.x}
          y={contextMenuPosition.y}
          canvasX={contextMenuCanvasPos.canvasX}
          canvasY={contextMenuCanvasPos.canvasY}
          isOpen={isContextMenuOpen}
          onClose={closeContextMenu}
          onToolSelect={handleBpmnToolSelect}
          drawingConnector={drawingConnector}
        />
      )}
      {isContextMenuOpen && contextMenuPosition && contextMenuCanvasPos && diagram?.type === 'class' && (
        <ClassToolsetPopover
          x={contextMenuPosition.x}
          y={contextMenuPosition.y}
          canvasX={contextMenuCanvasPos.canvasX}
          canvasY={contextMenuCanvasPos.canvasY}
          isOpen={isContextMenuOpen}
          onClose={closeContextMenu}
          onToolSelect={handleClassToolSelect}
          drawingConnector={drawingConnector}
        />
      )}
      {isContextMenuOpen && contextMenuPosition && (!contextMenuCanvasPos || (diagram?.type !== 'bpmn' && diagram?.type !== 'class')) && (
        <ContextMenu
          x={contextMenuPosition.x}
          y={contextMenuPosition.y}
          isOpen={isContextMenuOpen}
          onClose={closeContextMenu}
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
      {isConnectorPopoverOpen && connectorPopoverPosition && (
        <ConnectorToolsetPopover
          x={connectorPopoverPosition.x}
          y={connectorPopoverPosition.y}
          isOpen={isConnectorPopoverOpen}
          onClose={handleCloseConnectorPopover}
          onConnectorSelect={handleConnectorSelect}
          connectorTools={availableConnectorTools}
          activeConnectorType={activeConnectorType}
        />
      )}

      {/* Connector Context Menu (right-click on connector) */}
      {isConnectorContextMenuOpen && connectorContextMenuPosition && rightClickedConnectorId && (
        <ConnectorContextMenu
          x={connectorContextMenuPosition.x}
          y={connectorContextMenuPosition.y}
          isOpen={isConnectorContextMenuOpen}
          onClose={handleCloseConnectorContextMenu}
          onConnectorTypeChange={handleConnectorTypeChange}
          connectorTools={availableConnectorTools}
          currentConnectorType={connectors.find(c => c.id === rightClickedConnectorId)?.type}
        />
      )}

      {/* Debug info (optional - can be removed) */}
      <CanvasDebugInfo diagramId={diagramId} zoom={zoom} shapesCount={shapes.length} />
    </div>
  );
}

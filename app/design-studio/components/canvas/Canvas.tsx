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
import { screenToCanvas } from '../../utils/canvas';
import { GridBackground } from './GridBackground';
import { ContextMenu } from './ContextMenu';
import { BpmnToolsetPopover } from './BpmnToolsetPopover';
import { CanvasDebugInfo } from './CanvasDebugInfo';
import { ConnectorDrawingPreview } from './ConnectorDrawingPreview';
import { CanvasShapesList } from './CanvasShapesList';
import { CanvasConnectorsList } from './CanvasConnectorsList';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import CanvasToolbar from '../toolbar/CanvasToolbar';
import type { ToolbarButton } from '../toolbar/CanvasToolbar';
import { TbGridDots } from 'react-icons/tb';
import type { Tool } from '../../config/bpmn-tools';

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

  // Get isolated instance store for THIS diagram
  const canvasInstance = useCanvasInstance(diagramId);

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

  // Get persisted canvas data from entity store (for initialization only)
  const { diagram, loading } = useDiagram(diagramId);
  const { addShape, updateShapes, addConnector, deleteConnector } = useDiagramCRUD(diagramId);
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

  // Initialize local content from entity store ONCE on mount
  // After initialization, local state is autonomous and updated by commands
  // Commands coordinate updates to both local state and entity store
  useEffect(() => {
    if (!loading && (entityShapes.length > 0 || entityConnectors.length > 0) && !isInitialized) {
      // Use requestAnimationFrame to defer state update
      const frameId = requestAnimationFrame(() => {
        initializeContent(entityShapes, entityConnectors);
        setIsInitialized(true);
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [loading, entityShapes, entityConnectors, initializeContent, isInitialized]);

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
  const handleBpmnToolSelect = useCallback(async (tool: Tool, canvasX: number, canvasY: number) => {
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
    deleteConnector,
    setSelectedConnectors,
  });

  // Handle mouse down for panning and selection
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1) {  // Middle mouse button
      e.preventDefault();
      startPanning(e.clientX, e.clientY);
    } else if (e.button === 0) {  // Left mouse button - start selection box
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      startSelection(screenX, screenY);
    }
  }, [startPanning, startSelection]);

  // Handle mouse move for panning, dragging, and selection box
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Priority 0: Drawing connector (highest priority)
    if (drawingConnector) {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      updateDrawingConnector(screenX, screenY);
      return;
    }

    // Priority 1: Panning
    if (isPanning) {
      updatePanning(e.clientX, e.clientY);
      return;
    }

    // Priority 2: Dragging shapes
    if (isDraggingShapesRef.current && dragStartCanvasPosRef.current) {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      updateDragging(screenX, screenY, rect);
      return;
    }

    // Priority 3: Selection box dragging
    if (isSelectingRef.current && selectionBox) {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      updateSelection(screenX, screenY);
    }
  }, [selectionBox, drawingConnector, isPanning, updatePanning, updateDrawingConnector, updateSelection, updateDragging, dragStartCanvasPosRef, isDraggingShapesRef, isSelectingRef]);

  // Handle mouse up for panning, dragging, and selection box
  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Handle drawing connector - cancel if released on canvas (not on a connection point)
      if (drawingConnector) {
        cancelDrawingConnector();
        return;
      }

      // Handle panning
      if (isPanning) {
        stopPanning();
        return;
      }

      // Handle drag shapes end
      if (e.button === 0 && isDraggingShapesRef.current) {
        finishDragging();
        return;
      }

      // Handle selection box
      if (e.button === 0 && isSelectingRef.current) {
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        finishSelection(screenX, screenY);
      }
    },
    [isPanning, stopPanning, drawingConnector, cancelDrawingConnector, isSelectingRef, finishSelection, finishDragging, isDraggingShapesRef]
  );

  // Handle shape mouse down for selection and drag initialization
  const handleShapeMouseDown = useCallback(
    (e: React.MouseEvent, shapeId: string) => {
      // Stop propagation to prevent canvas background click
      e.stopPropagation();

      // Only handle left mouse button
      if (e.button !== 0) return;

      const container = containerRef.current;
      if (!container) return;

      // Get mouse position in screen and canvas coordinates
      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const { x: canvasX, y: canvasY } = screenToCanvas(
        screenX,
        screenY,
        zoom,
        panX,
        panY
      );

      // Check for multi-select modifiers (Shift, Ctrl, or Cmd on Mac)
      const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;

      // Determine which shapes will be dragged BEFORE modifying selection
      let shapesToDrag: string[];

      if (isMultiSelect) {
        // Toggle shape in selection
        if (selectedShapeIds.includes(shapeId)) {
          // Remove from selection
          setSelectedShapes(selectedShapeIds.filter((id) => id !== shapeId));
          // Don't start dragging if we just deselected
          return;
        } else {
          // Add to selection
          const newSelection = [...selectedShapeIds, shapeId];
          setSelectedShapes(newSelection);
          // Drag all newly selected shapes
          shapesToDrag = newSelection;
        }
      } else {
        // If clicking on a non-selected shape, select only that shape
        if (!selectedShapeIds.includes(shapeId)) {
          setSelectedShapes([shapeId]);
          shapesToDrag = [shapeId];
        } else {
          // Clicking on a selected shape - drag all currently selected shapes
          shapesToDrag = selectedShapeIds;
        }
      }

      // Start dragging
      startDragging(canvasX, canvasY, shapesToDrag);
      lastMousePosRef.current = { x: screenX, y: screenY };
    },
    [selectedShapeIds, setSelectedShapes, panX, panY, zoom, startDragging]
  );

  // Handle shape mouse enter for hover state
  const handleShapeMouseEnter = useCallback(
    (e: React.MouseEvent, shapeId: string) => {
      setHoveredShapeId(shapeId);
    },
    [setHoveredShapeId]
  );

  // Handle shape mouse leave for hover state
  const handleShapeMouseLeave = useCallback(
    (_e: React.MouseEvent, _shapeId: string) => {
      setHoveredShapeId(null);
    },
    [setHoveredShapeId]
  );

  // Handle connector mouse down for selection
  const handleConnectorMouseDown = useCallback(
    (e: React.MouseEvent, connectorId: string) => {
      e.stopPropagation();

      // Only handle left mouse button
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

  // Configure toolbar buttons
  const toolbarButtons: ToolbarButton[] = useMemo(
    () => [
      {
        id: 'grid-snap',
        icon: <TbGridDots size={16} />,
        onClick: () => setGridSnappingEnabled(!gridSnappingEnabled),
        tooltip: gridSnappingEnabled ? 'Disable grid snapping' : 'Enable grid snapping (10px)',
        active: gridSnappingEnabled,
      },
    ],
    [gridSnappingEnabled, setGridSnappingEnabled]
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
      {isContextMenuOpen && contextMenuPosition && (!contextMenuCanvasPos || diagram?.type !== 'bpmn') && (
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

      {/* Debug info (optional - can be removed) */}
      <CanvasDebugInfo diagramId={diagramId} zoom={zoom} shapesCount={shapes.length} />
    </div>
  );
}

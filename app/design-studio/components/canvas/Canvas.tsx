import { useRef, useEffect, useCallback, useState } from 'react';
import { useCanvasInstance } from '../../store/content/useCanvasInstance';
import { useDiagram } from '../../hooks/useDiagrams';
import { useDiagramCRUD } from '../../hooks/useDiagramCRUD';
import { useDesignStudioEntityStore } from '~/core/entities/design-studio';
import {
  constrainZoom,
  calculateZoomFromWheel,
  calculateZoomToPoint,
  screenToCanvas,
  normalizeRectangle,
  getShapeBounds,
  rectanglesIntersect,
  distance,
} from '../../utils/canvas';
import { GridBackground } from './GridBackground';
import { ShapeLayer } from './ShapeLayer';
import { ContextMenu } from './ContextMenu';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

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

/**
 * Selection box coordinates in screen space
 */
interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function Canvas({ diagramId }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shapesLayerRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const isSelectingRef = useRef(false);
  const isDraggingShapesRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const dragStartCanvasPosRef = useRef<{ x: number; y: number } | null>(null);
  const shapesStartPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Selection box state (null when not active)
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);

  // Drag delta state for smooth dragging without persistence
  const [dragDelta, setDragDelta] = useState<{ x: number; y: number } | null>(null);

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
  const isContextMenuOpen = canvasInstance((state) => state.isContextMenuOpen);
  const contextMenuPosition = canvasInstance((state) => state.contextMenuPosition);

  // Get LOCAL editing state (ephemeral, not persisted until commit)
  const localShapes = canvasInstance((state) => state.localShapes);
  const localConnectors = canvasInstance((state) => state.localConnectors);

  // Get instance actions
  const setViewport = canvasInstance((state) => state.setViewport);
  const openContextMenu = canvasInstance((state) => state.openContextMenu);
  const closeContextMenu = canvasInstance((state) => state.closeContextMenu);
  const setSelectedShapes = canvasInstance((state) => state.setSelectedShapes);
  const setHoveredShapeId = canvasInstance((state) => state.setHoveredShapeId);
  const clearSelection = canvasInstance((state) => state.clearSelection);
  const initializeContent = canvasInstance((state) => state.initializeContent);
  const updateLocalShape = canvasInstance((state) => state.updateLocalShape);
  const updateLocalShapes = canvasInstance((state) => state.updateLocalShapes);
  const addLocalShape = canvasInstance((state) => state.addLocalShape);

  // Get persisted canvas data from entity store (for initialization only)
  const { diagram, loading } = useDiagram(diagramId);
  const { addShape, updateShape, updateShapes } = useDiagramCRUD(diagramId);
  const entityShapes = diagram?.shapes || [];

  // Enable keyboard shortcuts for undo/redo
  useKeyboardShortcuts({ scope: diagramId });

  // Initialize local content from entity store ONCE on mount
  // After initialization, local state is autonomous and updated by commands
  // Commands coordinate updates to both local state and entity store
  useEffect(() => {
    if (!loading && entityShapes && entityShapes.length > 0 && !isInitialized) {
      initializeContent(entityShapes, []);  // TODO: Add connectors when implemented
      setIsInitialized(true);
    }
  }, [loading, entityShapes, initializeContent, isInitialized]);

  // Render from local shapes (working copy), fallback to entity shapes if local not initialized
  const shapes = localShapes.length > 0 ? localShapes : entityShapes;

  // Handle mouse wheel zoom
  const handleWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();

      const container = containerRef.current;
      if (!container) return;

      // Get cursor position relative to container
      const rect = container.getBoundingClientRect();
      const cursorX = event.clientX - rect.left;
      const cursorY = event.clientY - rect.top;

      // Calculate new zoom
      const newZoom = calculateZoomFromWheel(zoom, event.deltaY);

      // Calculate new pan to zoom to cursor position
      const { panX: newPanX, panY: newPanY } = calculateZoomToPoint(
        cursorX,
        cursorY,
        zoom,
        newZoom,
        panX,
        panY
      );

      setViewport(newZoom, newPanX, newPanY);
    },
    [zoom, panX, panY, setViewport]
  );

  // Attach wheel listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Handle mouse down for panning and selection
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1) {  // Middle mouse button
      e.preventDefault();
      isPanningRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    } else if (e.button === 0) {  // Left mouse button - start selection box
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      isSelectingRef.current = true;
      lastMousePosRef.current = { x: screenX, y: screenY };

      // Initialize selection box
      setSelectionBox({
        startX: screenX,
        startY: screenY,
        endX: screenX,
        endY: screenY,
      });
    }
  }, []);

  // Handle mouse move for panning, dragging, and selection box
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Priority 1: Panning
    if (isPanningRef.current) {
      const deltaX = e.clientX - lastMousePosRef.current.x;
      const deltaY = e.clientY - lastMousePosRef.current.y;

      setViewport(zoom, panX + deltaX, panY + deltaY);

      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Priority 2: Dragging shapes
    if (isDraggingShapesRef.current && dragStartCanvasPosRef.current) {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      // Convert current mouse position to canvas coordinates
      const { x: currentCanvasX, y: currentCanvasY } = screenToCanvas(
        screenX,
        screenY,
        zoom,
        panX,
        panY
      );

      // Calculate delta in canvas space
      const deltaX = currentCanvasX - dragStartCanvasPosRef.current.x;
      const deltaY = currentCanvasY - dragStartCanvasPosRef.current.y;

      // Update LOCAL state only (ephemeral, not persisted)
      // Build batch update map for performance
      const updates = new Map<string, Partial<typeof shapes[0]>>();
      shapesStartPositionsRef.current.forEach((startPos, shapeId) => {
        updates.set(shapeId, {
          x: startPos.x + deltaX,
          y: startPos.y + deltaY,
        });
      });

      // Single batch update to local state
      updateLocalShapes(updates);

      // Store delta for command creation on mouseup
      setDragDelta({ x: deltaX, y: deltaY });

      return;
    }

    // Priority 3: Selection box dragging
    if (isSelectingRef.current && selectionBox) {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      setSelectionBox((prev) =>
        prev ? { ...prev, endX: screenX, endY: screenY } : null
      );
    }
  }, [zoom, panX, panY, setViewport, selectionBox, updateLocalShapes]);

  // Handle mouse up for panning, dragging, and selection box
  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Handle panning
      if (isPanningRef.current) {
        isPanningRef.current = false;
        return;
      }

      // Handle drag shapes end
      if (e.button === 0 && isDraggingShapesRef.current) {
        // Create composite command for undo/redo if there was any drag
        if (dragDelta && (dragDelta.x !== 0 || dragDelta.y !== 0) && updateShapes) {
          // Batch all shape updates into a single composite command
          const shapeUpdates = Array.from(shapesStartPositionsRef.current.entries()).map(
            ([shapeId, startPos]) => ({
              shapeId,
              updates: {
                x: startPos.x + dragDelta.x,
                y: startPos.y + dragDelta.y,
              },
            })
          );
          updateShapes(shapeUpdates);
        }

        // Clear drag state
        isDraggingShapesRef.current = false;
        dragStartCanvasPosRef.current = null;
        shapesStartPositionsRef.current.clear();
        setDragDelta(null);
        return;
      }

      // Handle selection box
      if (e.button === 0 && isSelectingRef.current) {
        const container = containerRef.current;
        if (!container || !selectionBox) {
          isSelectingRef.current = false;
          setSelectionBox(null);
          return;
        }

        const rect = container.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // Calculate drag distance to detect click vs drag
        const dragDistance = distance(
          { x: screenX, y: screenY },
          lastMousePosRef.current
        );

        if (dragDistance < 5) {
          // Just a click, clear selection
          clearSelection();
        } else {
          // It was a drag, select shapes in box
          const selectedIds: string[] = [];

          // Normalize selection box coordinates (handle drag in any direction)
          const screenBox = normalizeRectangle(
            selectionBox.startX,
            selectionBox.startY,
            selectionBox.endX,
            selectionBox.endY
          );

          // Convert selection box from screen space to canvas space
          const { x: canvasBoxLeft, y: canvasBoxTop } = screenToCanvas(
            screenBox.left,
            screenBox.top,
            zoom,
            panX,
            panY
          );
          const { x: canvasBoxRight, y: canvasBoxBottom } = screenToCanvas(
            screenBox.right,
            screenBox.bottom,
            zoom,
            panX,
            panY
          );

          const canvasBox = {
            left: canvasBoxLeft,
            right: canvasBoxRight,
            top: canvasBoxTop,
            bottom: canvasBoxBottom,
          };

          // Check each shape for intersection using AABB algorithm
          shapes.forEach((shape) => {
            const shapeBounds = getShapeBounds(shape);

            if (rectanglesIntersect(canvasBox, shapeBounds)) {
              selectedIds.push(shape.id);
            }
          });

          setSelectedShapes(selectedIds);
        }

        // Reset selection box state
        isSelectingRef.current = false;
        setSelectionBox(null);
      }
    },
    [selectionBox, panX, panY, zoom, shapes, clearSelection, setSelectedShapes, dragDelta, updateShapes]
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

      // Prepare for dragging: store original positions of shapes to drag
      const positionsMap = new Map<string, { x: number; y: number }>();

      shapes.forEach((shape) => {
        if (shapesToDrag.includes(shape.id)) {
          positionsMap.set(shape.id, { x: shape.x, y: shape.y });
        }
      });

      shapesStartPositionsRef.current = positionsMap;
      isDraggingShapesRef.current = true;
      dragStartCanvasPosRef.current = { x: canvasX, y: canvasY };
      lastMousePosRef.current = { x: screenX, y: screenY };
    },
    [selectedShapeIds, setSelectedShapes, shapes, panX, panY, zoom]
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
    (e: React.MouseEvent, shapeId: string) => {
      setHoveredShapeId(null);
    },
    [setHoveredShapeId]
  );

  // Handle right-click
  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();

      const container = containerRef.current;
      if (!container) return;

      // Get click position in screen coordinates
      const rect = container.getBoundingClientRect();
      const screenX = event.clientX - rect.left;
      const screenY = event.clientY - rect.top;

      // Open context menu at screen position
      openContextMenu(event.clientX, event.clientY);

      // Store canvas position for shape creation
      const { x: canvasX, y: canvasY } = screenToCanvas(screenX, screenY, zoom, panX, panY);
      (event.currentTarget as any)._contextClickPos = { canvasX, canvasY };
    },
    [zoom, panX, panY, openContextMenu]
  );

  // Handle add rectangle from context menu
  const handleAddRectangle = useCallback(async () => {
    const container = containerRef.current;
    if (!container || !addShape) return;

    // Get stored canvas position from last right-click
    const storedPos = (container as any)._contextClickPos;
    if (!storedPos) return;

    const { canvasX, canvasY } = storedPos;

    // Persist to entity store (will trigger command and re-initialize local state)
    await addShape({
      type: 'rectangle',
      x: canvasX,
      y: canvasY,
      width: 120,
      height: 80,
      zIndex: 0,
      locked: false,
    });

    // Clean up stored position
    delete (container as any)._contextClickPos;
  }, [addShape]);

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
      style={{
        touchAction: 'none',
        cursor: isPanningRef.current ? 'grabbing' : 'default',
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

      {/* SVG Layer for future connectors (transformed) */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: '0 0',
          overflow: 'visible',
        }}
      >
        {/* Connectors will be rendered here in the future */}
      </svg>

      {/* Shapes Layer (transformed, HTML divs) */}
      <div
        ref={shapesLayerRef}
        className="absolute inset-0"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <ShapeLayer
          shapes={shapes}
          selectedShapeIds={selectedShapeIds}
          hoveredShapeId={hoveredShapeId}
          zoom={zoom}
          onShapeMouseDown={handleShapeMouseDown}
          onShapeMouseEnter={handleShapeMouseEnter}
          onShapeMouseLeave={handleShapeMouseLeave}
        />
      </div>

      {/* Context menu (rendered in screen space, not transformed) */}
      {isContextMenuOpen && contextMenuPosition && (
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
            border: '2px dashed #3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
          }}
        />
      )}

      {/* Debug info (optional - can be removed) */}
      <div className="absolute bottom-2 right-2 text-xs text-[var(--text-muted)] bg-[var(--bg)] px-2 py-1 rounded border border-[var(--border-muted)]">
        <div>Diagram: {diagramId.slice(0, 8)}...</div>
        <div>Zoom: {(zoom * 100).toFixed(0)}%</div>
        <div>Shapes: {shapes.length}</div>
      </div>
    </div>
  );
}

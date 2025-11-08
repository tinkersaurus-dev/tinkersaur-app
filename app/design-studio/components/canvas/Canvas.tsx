import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useCanvasInstance } from '../../store/content/useCanvasInstance';
import { useDiagram } from '../../hooks/useDiagrams';
import { useDiagramCRUD } from '../../hooks/useDiagramCRUD';
import { useDesignStudioEntityStore } from '~/core/entities/design-studio';
import {
  calculateZoomFromWheel,
  calculateZoomToPoint,
  screenToCanvas,
  normalizeRectangle,
  getShapeBounds,
  getConnectorBounds,
  rectanglesIntersect,
  distance,
} from '../../utils/canvas';
import { GridBackground } from './GridBackground';
import { ShapeRenderer } from '../../rendering/shapes/ShapeRenderer';
import type { RenderContext } from '../../rendering/shapes/types';
import { ConnectorRenderer } from '../../rendering/connectors/ConnectorRenderer';
import type { ConnectorRenderContext } from '../../rendering/connectors/types';
import { ContextMenu } from './ContextMenu';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import CanvasToolbar from '../toolbar/CanvasToolbar';
import type { ToolbarButton } from '../toolbar/CanvasToolbar';
import { TbGridDots } from 'react-icons/tb';

/**
 * Snap a coordinate to the nearest grid point
 */
function snapToGrid(value: number, gridSize: number = 10): number {
  return Math.round(value / gridSize) * gridSize;
}

// Extend HTMLDivElement to include custom properties for context menu
interface CanvasContainerElement extends HTMLDivElement {
  _contextClickPos?: { canvasX: number; canvasY: number };
}

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
  const [isPanning, setIsPanning] = useState(false);
  const isSelectingRef = useRef(false);
  const isDraggingShapesRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const dragStartCanvasPosRef = useRef<{ x: number; y: number } | null>(null);
  const shapesStartPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Selection box state (null when not active)
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);

  // Drag delta state for smooth dragging without persistence
  const [dragDelta, setDragDelta] = useState<{ x: number; y: number } | null>(null);

  // Connector drawing state (null when not drawing)
  const [drawingConnector, setDrawingConnector] = useState<{
    fromShapeId: string;
    fromDirection: 'N' | 'S' | 'E' | 'W';
    currentX: number;
    currentY: number;
  } | null>(null);

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

  // Handle Delete key for selected connectors
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if typing in an input field
      const target = event.target as Element;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as HTMLElement).isContentEditable)) {
        return;
      }

      // Delete selected connectors
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedConnectorIds.length > 0 && deleteConnector) {
        event.preventDefault();
        // Delete all selected connectors
        selectedConnectorIds.forEach((connectorId) => {
          deleteConnector(connectorId);
        });
        // Clear selection after deletion
        setSelectedConnectors([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedConnectorIds, deleteConnector, setSelectedConnectors]);

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
      setIsPanning(true);
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
    // Priority 0: Drawing connector (highest priority)
    if (drawingConnector) {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const { x: canvasX, y: canvasY } = screenToCanvas(screenX, screenY, zoom, panX, panY);

      setDrawingConnector((prev) =>
        prev ? { ...prev, currentX: canvasX, currentY: canvasY } : null
      );
      return;
    }

    // Priority 1: Panning
    if (isPanning) {
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
        let newX = startPos.x + deltaX;
        let newY = startPos.y + deltaY;

        // Apply grid snapping if enabled
        if (gridSnappingEnabled) {
          newX = snapToGrid(newX);
          newY = snapToGrid(newY);
        }

        updates.set(shapeId, {
          x: newX,
          y: newY,
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
  }, [zoom, panX, panY, setViewport, selectionBox, updateLocalShapes, drawingConnector, isPanning, gridSnappingEnabled]);

  // Handle mouse up for panning, dragging, and selection box
  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Handle drawing connector - cancel if released on canvas (not on a connection point)
      if (drawingConnector) {
        setDrawingConnector(null);
        return;
      }

      // Handle panning
      if (isPanning) {
        setIsPanning(false);
        return;
      }

      // Handle drag shapes end
      if (e.button === 0 && isDraggingShapesRef.current) {
        // Create composite command for undo/redo if there was any drag
        if (dragDelta && (dragDelta.x !== 0 || dragDelta.y !== 0) && updateShapes) {
          // Batch all shape updates into a single composite command
          // Use the actual positions from localShapes (which may have been snapped)
          const shapeUpdates = Array.from(shapesStartPositionsRef.current.entries()).map(
            ([shapeId, startPos]) => {
              const currentShape = localShapes.find(s => s.id === shapeId);
              return {
                shapeId,
                updates: {
                  x: currentShape?.x ?? startPos.x + dragDelta.x,
                  y: currentShape?.y ?? startPos.y + dragDelta.y,
                },
              };
            }
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
          // It was a drag, select shapes and connectors in box
          const selectedShapeIds: string[] = [];
          const selectedConnectorIds: string[] = [];

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
              selectedShapeIds.push(shape.id);
            }
          });

          // Create a shape map for connector bounds calculation
          const shapeMap = new Map(shapes.map((shape) => [shape.id, shape]));

          // Check each connector for intersection using AABB algorithm
          connectors.forEach((connector) => {
            const sourceShape = shapeMap.get(connector.sourceShapeId);
            const targetShape = shapeMap.get(connector.targetShapeId);

            // Skip if either shape is missing
            if (!sourceShape || !targetShape) return;

            const connectorBounds = getConnectorBounds(connector, sourceShape, targetShape);

            if (rectanglesIntersect(canvasBox, connectorBounds)) {
              selectedConnectorIds.push(connector.id);
            }
          });

          // Use the new setSelection action to select both shapes and connectors
          setSelection(selectedShapeIds, selectedConnectorIds);
        }

        // Reset selection box state
        isSelectingRef.current = false;
        setSelectionBox(null);
      }
    },
    [selectionBox, panX, panY, zoom, shapes, connectors, clearSelection, setSelection, dragDelta, updateShapes, isPanning, drawingConnector, localShapes]
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

  // Handle shape double-click for label editing
  const handleShapeDoubleClick = useCallback(
    (shapeId: string) => {
      const shape = localShapes.find((s) => s.id === shapeId);
      if (shape) {
        setEditingEntity(shapeId, 'shape', shape.label);
      }
    },
    [localShapes, setEditingEntity]
  );

  // Handle connector double-click for label editing
  const handleConnectorDoubleClick = useCallback(
    (connectorId: string) => {
      const connector = localConnectors.find((c) => c.id === connectorId);
      if (connector) {
        setEditingEntity(connectorId, 'connector', connector.label);
      }
    },
    [localConnectors, setEditingEntity]
  );

  // Handle label change during editing (updates local state only)
  const handleLabelChange = useCallback(
    (entityId: string, entityType: 'shape' | 'connector', newLabel: string) => {
      if (entityType === 'shape') {
        updateLocalShape(entityId, { label: newLabel });
      } else {
        updateLocalConnector(entityId, { label: newLabel });
      }
    },
    [updateLocalShape, updateLocalConnector]
  );

  // Handle finish editing (creates command if label changed)
  const handleFinishEditing = useCallback(
    async () => {
      if (!editingEntityId || !editingEntityType) return;

      // Get current label
      let currentLabel: string | undefined;
      if (editingEntityType === 'shape') {
        const shape = localShapes.find((s) => s.id === editingEntityId);
        currentLabel = shape?.label;
      } else {
        const connector = localConnectors.find((c) => c.id === editingEntityId);
        currentLabel = connector?.label;
      }

      // Only create command if label actually changed
      if (currentLabel !== editingOriginalLabel) {
        if (editingEntityType === 'shape') {
          await updateShapeLabel(diagramId, editingEntityId, currentLabel || '');
        } else {
          await updateConnectorLabel(diagramId, editingEntityId, currentLabel || '');
        }
      }

      // Clear editing state
      clearEditingEntity();
    },
    [
      editingEntityId,
      editingEntityType,
      editingOriginalLabel,
      localShapes,
      localConnectors,
      updateShapeLabel,
      updateConnectorLabel,
      diagramId,
      clearEditingEntity,
    ]
  );

  // Handle connection point mouse down (start drawing connector)
  const handleConnectionPointMouseDown = useCallback(
    (pointId: string, direction: 'N' | 'S' | 'E' | 'W', e: React.MouseEvent) => {
      e.stopPropagation();

      const container = containerRef.current;
      if (!container) return;

      // Parse shape ID from point ID (format: "{shapeId}-{direction}")
      const shapeId = pointId.split('-').slice(0, -1).join('-');

      // Get current mouse position in canvas coordinates
      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const { x: canvasX, y: canvasY } = screenToCanvas(screenX, screenY, zoom, panX, panY);

      // Start drawing connector
      setDrawingConnector({
        fromShapeId: shapeId,
        fromDirection: direction,
        currentX: canvasX,
        currentY: canvasY,
      });
    },
    [zoom, panX, panY]
  );

  // Handle connection point mouse up (complete drawing connector)
  const handleConnectionPointMouseUp = useCallback(
    async (pointId: string, direction: 'N' | 'S' | 'E' | 'W', e: React.MouseEvent) => {
      e.stopPropagation();

      if (!drawingConnector) return;

      // Parse shape ID from point ID
      const toShapeId = pointId.split('-').slice(0, -1).join('-');

      // Don't allow connecting to the same shape
      if (toShapeId === drawingConnector.fromShapeId) {
        setDrawingConnector(null);
        return;
      }

      // Create connector via command (with undo/redo support)
      // NOTE: We omit sourceConnectionPoint and targetConnectionPoint
      // The renderer will dynamically calculate the closest connection points
      if (addConnector) {
        await addConnector({
          type: 'line',
          sourceShapeId: drawingConnector.fromShapeId,
          targetShapeId: toShapeId,
          // Connection points are omitted - they'll be calculated dynamically
          style: 'orthogonal',
          arrowType: 'arrow',
          lineType: 'solid',
          zIndex: 0,
        });
      }

      // Clear drawing state
      setDrawingConnector(null);
    },
    [drawingConnector, addConnector]
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
      (event.currentTarget as CanvasContainerElement)._contextClickPos = { canvasX, canvasY };
    },
    [zoom, panX, panY, openContextMenu]
  );

  // Handle add rectangle from context menu
  const handleAddRectangle = useCallback(async () => {
    const container = containerRef.current as CanvasContainerElement | null;
    if (!container || !addShape) return;

    // Get stored canvas position from last right-click
    const storedPos = container._contextClickPos;
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
    delete container._contextClickPos;
  }, [addShape]);

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
        ref={shapesLayerRef}
        className="absolute inset-0"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Render all shapes */}
        {shapes.map((shape) => {
          const shapeContext: RenderContext = {
            isSelected: selectedShapeIds.includes(shape.id),
            isHovered: shape.id === hoveredShapeId,
            zoom,
            readOnly: false,
          };

          const isEditing = editingEntityId === shape.id && editingEntityType === 'shape';

          return (
            <ShapeRenderer
              key={shape.id}
              shape={shape}
              context={shapeContext}
              isEditing={isEditing}
              onMouseDown={handleShapeMouseDown}
              onMouseEnter={handleShapeMouseEnter}
              onMouseLeave={handleShapeMouseLeave}
              onDoubleClick={handleShapeDoubleClick}
              onLabelChange={handleLabelChange}
              onFinishEditing={handleFinishEditing}
              onConnectionPointMouseDown={handleConnectionPointMouseDown}
              onConnectionPointMouseUp={handleConnectionPointMouseUp}
            />
          );
        })}

        {/* Render all connectors */}
        {connectors.map((connector) => {
          const sourceShape = shapes.find((s) => s.id === connector.sourceShapeId);
          const targetShape = shapes.find((s) => s.id === connector.targetShapeId);

          // Skip rendering if either shape is missing
          if (!sourceShape || !targetShape) {
            console.warn(
              `Connector ${connector.id} references missing shape(s): ` +
                `source=${connector.sourceShapeId}, target=${connector.targetShapeId}`
            );
            return null;
          }

          const connectorContext: ConnectorRenderContext = {
            isSelected: selectedConnectorIds.includes(connector.id),
            isHovered: connector.id === hoveredConnectorId,
            zoom,
            readOnly: false,
          };

          const isEditing = editingEntityId === connector.id && editingEntityType === 'connector';

          return (
            <svg
              key={connector.id}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                overflow: 'visible',
                pointerEvents: 'none',
                zIndex: 2, // Connectors on top of shapes
              }}
            >
              <ConnectorRenderer
                connector={connector}
                sourceShape={sourceShape}
                targetShape={targetShape}
                context={connectorContext}
                isEditing={isEditing}
                onMouseDown={handleConnectorMouseDown}
                onMouseEnter={handleConnectorMouseEnter}
                onMouseLeave={handleConnectorMouseLeave}
                onDoubleClick={handleConnectorDoubleClick}
                onLabelChange={handleLabelChange}
                onFinishEditing={handleFinishEditing}
              />
            </svg>
          );
        })}

        {/* Connector drawing preview line */}
        {drawingConnector && (() => {
          const fromShape = shapes.find((s) => s.id === drawingConnector.fromShapeId);
          if (!fromShape) return null;

          // Calculate start position from shape and direction
          let startX = fromShape.x;
          let startY = fromShape.y;
          switch (drawingConnector.fromDirection) {
            case 'N':
              startX += fromShape.width / 2;
              startY += 0;
              break;
            case 'S':
              startX += fromShape.width / 2;
              startY += fromShape.height;
              break;
            case 'E':
              startX += fromShape.width;
              startY += fromShape.height / 2;
              break;
            case 'W':
              startX += 0;
              startY += fromShape.height / 2;
              break;
          }

          const strokeWidth = 2 / zoom;

          return (
            <svg
              style={{
                position: 'absolute',
                inset: 0,
                overflow: 'visible',
                pointerEvents: 'none',
              }}
            >
              <line
                x1={startX}
                y1={startY}
                x2={drawingConnector.currentX}
                y2={drawingConnector.currentY}
                stroke="var(--canvas-preview-stroke)"
                strokeWidth={strokeWidth}
                strokeDasharray={`${strokeWidth * 4} ${strokeWidth * 2}`}
                pointerEvents="none"
              />
            </svg>
          );
        })()}
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
            border: '2px dashed var(--canvas-selection-box-border)',
            backgroundColor: 'var(--canvas-selection-box-bg)',
          }}
        />
      )}

      {/* Canvas Toolbar */}
      <CanvasToolbar placement="bottom" buttons={toolbarButtons} />

      {/* Debug info (optional - can be removed) */}
      <div className="absolute bottom-2 right-2 text-xs text-[var(--text-muted)] bg-[var(--bg)] px-2 py-1 rounded border border-[var(--border-muted)]">
        <div>Diagram: {diagramId.slice(0, 8)}...</div>
        <div>Zoom: {(zoom * 100).toFixed(0)}%</div>
        <div>Shapes: {shapes.length}</div>
      </div>
    </div>
  );
}

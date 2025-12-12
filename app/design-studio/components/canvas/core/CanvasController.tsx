import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts';
import { useCanvasViewport } from '../../../hooks/useCanvasViewport';
import { useMermaidSync } from '../../../hooks/useMermaidSync';
import { useMermaidViewerStore } from '../../../store/mermaid/mermaidViewerStore';
import { useContextMenuManager } from '../../../hooks/useContextMenuManager';
import { useCanvasPasteHandler } from '../hooks/useCanvasPasteHandler';
import { useCanvasState } from '../hooks/useCanvasState';
import { useCanvasCommands } from '../hooks/useCanvasCommands';
import { useCanvasToolManager } from '../hooks/useCanvasToolManager';
import { useCanvasEventOrchestrator } from '../hooks/useCanvasEventOrchestrator';
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
 * Provides state and handlers to child components via focused context providers.
 *
 * This is a thin orchestrator that composes 4 focused hooks:
 * - useCanvasState: State initialization and store extraction
 * - useCanvasCommands: CRUD/command operations
 * - useCanvasToolManager: Tool selection and toolbar configuration
 * - useCanvasEventOrchestrator: Event handler coordination
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

  // Track if mermaid syntax has been initialized from diagram
  const mermaidInitializedRef = useRef(false);

  // 1. State hook - all store interactions
  const canvasState = useCanvasState({ diagramId });

  // 2. Menu manager (standalone hook)
  const menuManager = useContextMenuManager();

  // 3. Commands hook - CRUD wrappers and class/enum editing
  const commands = useCanvasCommands({
    diagramId,
    commandFactory: canvasState.commandFactory,
    getShape: canvasState.getShape,
    updateLocalShape: canvasState.storeActions.updateLocalShape,
  });

  // 4. Tool manager - tool selection and toolbar
  const toolManager = useCanvasToolManager({
    diagramId,
    diagramType: canvasState.diagram?.type,
    addShape: canvasState.crudOperations.addShape,
    addConnector: canvasState.crudOperations.addConnector,
    activeConnectorType: canvasState.activeConnectorType,
    menuManager,
    viewportTransform: canvasState.viewportTransform,
    gridSnappingEnabled: canvasState.gridSnappingEnabled,
    gridDisplayMode: canvasState.gridDisplayMode,
    setGridSnappingEnabled: canvasState.storeActions.setGridSnappingEnabled,
    setGridDisplayMode: canvasState.storeActions.setGridDisplayMode,
    setActiveConnectorType: canvasState.storeActions.setActiveConnectorType,
    commandFactory: canvasState.commandFactory,
    connectors: canvasState.connectors,
  });

  // 5. Event orchestrator - all event handlers
  const events = useCanvasEventOrchestrator({
    viewportTransform: canvasState.viewportTransform,
    shapes: canvasState.shapes,
    connectors: canvasState.connectors,
    localShapes: canvasState.localShapes,
    localConnectors: canvasState.localConnectors,
    selectedShapeIds: canvasState.selectedShapeIds,
    selectedConnectorIds: canvasState.selectedConnectorIds,
    gridSnappingEnabled: canvasState.gridSnappingEnabled,
    editingEntityId: canvasState.editingEntityId,
    editingEntityType: canvasState.editingEntityType,
    editingOriginalLabel: canvasState.editingOriginalLabel,
    storeActions: canvasState.storeActions,
    crudOperations: canvasState.crudOperations,
    commandFactory: canvasState.commandFactory,
    diagramId,
    diagramType: canvasState.diagram?.type,
    entityShapes: canvasState.entityShapes,
    containerRef,
    lastMousePosRef,
    menuManager,
    connectorTypeManager: toolManager.connectorTypeManager,
    activeConnectorType: canvasState.activeConnectorType,
    executeCommand: commands.executeCommand,
  });

  // 6. Side effects

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
    return canvasState.viewportTransform.screenToCanvas(screenX, screenY);
  }, [canvasState.viewportTransform]);

  // Enable paste handler for importing Mermaid diagrams
  useCanvasPasteHandler({
    diagramId,
    diagramType: canvasState.diagram?.type || 'bpmn',
    commandFactory: canvasState.commandFactory,
    canvasRef: containerRef,
    getMousePosition,
    enabled: !canvasState.loading && !!canvasState.diagram,
  });

  // Use custom hook for viewport wheel/pinch zoom handling
  useCanvasViewport({
    containerRef,
    viewportTransform: canvasState.viewportTransform,
  });

  // Mermaid sync hook - automatically generates mermaid syntax from committed shapes/connectors
  // Also persists the mermaid syntax to the diagram object for reuse across the app
  useMermaidSync({
    shapes: canvasState.entityShapes,
    connectors: canvasState.entityConnectors,
    diagramType: canvasState.diagram?.type,
    diagramId,
    enabled: true,
  });

  // Initialize mermaid viewer with persisted syntax when diagram first loads
  // Only run ONCE per diagram to avoid conflicts with auto-generation
  const setSyntax = useMermaidViewerStore((state) => state.setSyntax);
  useEffect(() => {
    if (canvasState.diagram && !mermaidInitializedRef.current) {
      if (canvasState.diagram.mermaidSyntax) {
        setSyntax(canvasState.diagram.mermaidSyntax);
      }
      mermaidInitializedRef.current = true;
    }
  }, [canvasState.diagram, setSyntax]);

  // Reset mermaid initialization flag when diagram ID changes
  useEffect(() => {
    mermaidInitializedRef.current = false;
  }, [diagramId]);

  // 7. Build context values
  const diagramContextValue: CanvasDiagramContext = useMemo(() => ({
    diagramId,
    diagram: canvasState.diagram,
    loading: canvasState.loading,
    shapes: canvasState.shapes,
    connectors: canvasState.connectors,
  }), [diagramId, canvasState.diagram, canvasState.loading, canvasState.shapes, canvasState.connectors]);

  const viewportContextValue: CanvasViewportContext = useMemo(() => ({
    viewportTransform: canvasState.viewportTransform,
  }), [canvasState.viewportTransform]);

  const selectionContextValue: CanvasSelectionContext = useMemo(() => ({
    selectedShapeIds: canvasState.selectedShapeIds,
    hoveredShapeId: canvasState.hoveredShapeId,
    selectedConnectorIds: canvasState.selectedConnectorIds,
    hoveredConnectorId: canvasState.hoveredConnectorId,
    hoveredContainerId: canvasState.hoveredContainerId,
    mode: events.mode,
    selectionBox: events.selectionBox,
    drawingConnector: events.drawingConnector,
    editingEntityId: canvasState.editingEntityId,
    editingEntityType: canvasState.editingEntityType,
    gridSnappingEnabled: canvasState.gridSnappingEnabled,
    gridDisplayMode: canvasState.gridDisplayMode,
    activeConnectorType: canvasState.activeConnectorType,
  }), [
    canvasState.selectedShapeIds,
    canvasState.hoveredShapeId,
    canvasState.selectedConnectorIds,
    canvasState.hoveredConnectorId,
    canvasState.hoveredContainerId,
    events.mode,
    events.selectionBox,
    events.drawingConnector,
    canvasState.editingEntityId,
    canvasState.editingEntityType,
    canvasState.gridSnappingEnabled,
    canvasState.gridDisplayMode,
    canvasState.activeConnectorType,
  ]);

  const eventsContextValue: CanvasEventsContext = useMemo(() => ({
    handleMouseDown: events.handleMouseDown,
    handleMouseMove: events.handleMouseMove,
    handleMouseUp: events.handleMouseUp,
    handleContextMenu: events.handleContextMenu,
    handleShapeMouseDown: events.handleShapeMouseDown,
    handleShapeMouseEnter: events.handleShapeMouseEnter,
    handleShapeMouseLeave: events.handleShapeMouseLeave,
    handleShapeDoubleClick: events.handleShapeDoubleClick,
    handleStartDrawingConnector: events.handleStartDrawingConnector,
    handleFinishDrawingConnector: events.handleFinishDrawingConnector,
    handleConnectorMouseDown: events.handleConnectorMouseDown,
    handleConnectorMouseEnter: events.handleConnectorMouseEnter,
    handleConnectorMouseLeave: events.handleConnectorMouseLeave,
    handleConnectorDoubleClick: events.handleConnectorDoubleClick,
    handleLabelChange: events.handleLabelChange,
    handleFinishEditing: events.handleFinishEditing,
    updateStereotype: commands.updateStereotype,
    addAttribute: commands.addAttribute,
    deleteAttribute: commands.deleteAttribute,
    updateAttribute: commands.updateAttribute,
    updateAttributeLocal: commands.updateAttributeLocal,
    addMethod: commands.addMethod,
    deleteMethod: commands.deleteMethod,
    updateMethod: commands.updateMethod,
    updateMethodLocal: commands.updateMethodLocal,
    addLiteral: commands.addLiteral,
    deleteLiteral: commands.deleteLiteral,
    updateLiteral: commands.updateLiteral,
    updateLiteralLocal: commands.updateLiteralLocal,
    menuManager,
    handleAddRectangle: toolManager.handleAddRectangle,
    handleBpmnToolSelect: toolManager.handleBpmnToolSelect,
    handleClassToolSelect: toolManager.handleClassToolSelect,
    handleSequenceToolSelect: toolManager.handleSequenceToolSelect,
    handleArchitectureToolSelect: toolManager.handleArchitectureToolSelect,
    handleConnectorToolbarClick: toolManager.handleConnectorToolbarClick,
    connectorTypeManager: toolManager.connectorTypeManager,
    toolbarButtons: toolManager.toolbarButtons,
    containerRef,
    handleResizeStart: events.handleResizeStart,
    orchestrationCursor: events.orchestrationCursor,
  }), [
    events.handleMouseDown,
    events.handleMouseMove,
    events.handleMouseUp,
    events.handleContextMenu,
    events.handleShapeMouseDown,
    events.handleShapeMouseEnter,
    events.handleShapeMouseLeave,
    events.handleShapeDoubleClick,
    events.handleStartDrawingConnector,
    events.handleFinishDrawingConnector,
    events.handleConnectorMouseDown,
    events.handleConnectorMouseEnter,
    events.handleConnectorMouseLeave,
    events.handleConnectorDoubleClick,
    events.handleLabelChange,
    events.handleFinishEditing,
    commands.updateStereotype,
    commands.addAttribute,
    commands.deleteAttribute,
    commands.updateAttribute,
    commands.updateAttributeLocal,
    commands.addMethod,
    commands.deleteMethod,
    commands.updateMethod,
    commands.updateMethodLocal,
    commands.addLiteral,
    commands.deleteLiteral,
    commands.updateLiteral,
    commands.updateLiteralLocal,
    menuManager,
    toolManager.handleAddRectangle,
    toolManager.handleBpmnToolSelect,
    toolManager.handleClassToolSelect,
    toolManager.handleSequenceToolSelect,
    toolManager.handleArchitectureToolSelect,
    toolManager.handleConnectorToolbarClick,
    toolManager.connectorTypeManager,
    toolManager.toolbarButtons,
    events.handleResizeStart,
    events.orchestrationCursor,
  ]);

  return (
    <DiagramContext.Provider value={diagramContextValue}>
      <ViewportContext.Provider value={viewportContextValue}>
        <SelectionContext.Provider value={selectionContextValue}>
          <EventsContext.Provider value={eventsContextValue}>
            {children}
          </EventsContext.Provider>
        </SelectionContext.Provider>
      </ViewportContext.Provider>
    </DiagramContext.Provider>
  );
}

import { memo, useCallback } from 'react';
import { useCanvasDiagram } from './CanvasDiagramContext';
import { useCanvasViewport } from './CanvasViewportContext';
import { useCanvasSelection } from './CanvasSelectionContext';
import { useCanvasEvents } from './CanvasEventsContext';
import { useCanvasReferenceDrop } from '../../../hooks/useCanvasReferenceDrop';
import { useSuggestionsGenerator } from '../../../hooks/useSuggestionsGenerator';
import { MermaidViewer } from '../../mermaid/MermaidViewer';
import { OverlayControlPanel } from '../../overlay/OverlayControlPanel';
import { RoutingDebugOverlay } from '../debug/RoutingDebugOverlay';
import { setDebugGraph } from '../debug/routingDebugState';

// Layer components - each subscribes only to the contexts it needs
import { GridLayer } from '../layers/GridLayer';
import { CanvasContentLayer } from '../layers/CanvasContentLayer';
import { MenusLayer } from '../layers/MenusLayer';
import { ToolbarLayer } from '../layers/ToolbarLayer';
import { SelectionBoxOverlay } from '../layers/SelectionBoxOverlay';

/**
 * Canvas View Component
 *
 * Pure presentation layer for the Canvas. Consumes CanvasController context
 * and renders UI based on state. Contains no business logic.
 *
 * Responsibilities:
 * - Render canvas container with viewport transform
 * - Render shapes, connectors, and UI overlays via layer components
 * - Delegate all events to handlers from context
 * - Display menus, toolbars, and popovers based on context state
 *
 * Performance Optimization:
 * - Wrapped in React.memo() to prevent unnecessary re-renders
 * - Split into layer components that subscribe only to needed contexts
 * - Each layer is memoized independently
 */
function CanvasViewComponent() {
  // Only consume what's needed at the container level
  const { diagram, loading, shapes, connectors } = useCanvasDiagram();
  const { viewportTransform } = useCanvasViewport();
  const { selectionBox } = useCanvasSelection();
  const {
    handleCanvasMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleContextMenu,
    containerRef,
    orchestrationCursor,
  } = useCanvasEvents();

  // Reference drop handling
  const { handleDragOver, handleDrop } = useCanvasReferenceDrop(
    diagram?.id,
    viewportTransform.viewport.zoom,
    viewportTransform.viewport.panX,
    viewportTransform.viewport.panY
  );

  // Suggestions generator
  const {
    isLoading: isSuggestionsLoading,
    generateAndDisplaySuggestions,
  } = useSuggestionsGenerator({
    diagramId: diagram?.id,
    diagramType: diagram?.type,
    shapes,
  });

  // Stable event handlers to avoid creating new functions on each render
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDropEvent = useCallback(
    (e: React.DragEvent) => {
      handleDrop(e, containerRef.current);
    },
    [handleDrop, containerRef]
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
      className="relative w-full h-full overflow-hidden bg-[var(--bg-light)] focus:outline-none"
      tabIndex={0}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDropEvent}
      style={{
        touchAction: 'none',
        cursor: orchestrationCursor,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Grid Layer - only re-renders on viewport/grid changes */}
      <GridLayer />

      {/* Canvas Content - shapes, connectors, drawing preview */}
      <CanvasContentLayer />

      {/* Menus Layer - popovers and context menus */}
      <MenusLayer />

      {/* Selection Box Overlay */}
      <SelectionBoxOverlay selectionBox={selectionBox} />

      {/* Toolbars */}
      <ToolbarLayer
        isSuggestionsLoading={isSuggestionsLoading}
        onGenerateSuggestions={generateAndDisplaySuggestions}
      />

      {/* Mermaid Viewer */}
      <MermaidViewer />

      {/* Overlay Control Panel (upper-left) */}
      <OverlayControlPanel shapes={shapes} connectors={connectors} />

      {/* Routing Debug Overlay - Press 'D' to toggle */}
      <RoutingDebugOverlay />
    </div>
  );
}

/**
 * Memoized CanvasView to prevent unnecessary re-renders
 * Combined with layer components, this significantly reduces re-renders
 * when unrelated state changes
 */
export const CanvasView = memo(CanvasViewComponent);

// Expose debug function globally
if (typeof window !== 'undefined') {
  (window as Window & { setRoutingDebugGraph?: typeof setDebugGraph }).setRoutingDebugGraph = setDebugGraph;
}

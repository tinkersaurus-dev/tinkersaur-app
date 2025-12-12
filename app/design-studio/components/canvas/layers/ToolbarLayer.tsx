import { memo } from 'react';
import { useCanvasDiagram } from '../core/CanvasDiagramContext';
import { useCanvasEvents } from '../core/CanvasEventsContext';
import CanvasToolbar from '../../toolbar/CanvasToolbar';
import CanvasTextToolbar from '../../toolbar/CanvasTextToolbar';

interface ToolbarLayerProps {
  isSuggestionsLoading: boolean;
  onGenerateSuggestions: () => void;
}

/**
 * ToolbarLayer Component
 *
 * Renders the canvas toolbars.
 * Isolated from canvas content updates.
 *
 * Subscribes to:
 * - DiagramContext (for diagram type)
 * - EventsContext (toolbar buttons)
 */
function ToolbarLayerComponent({
  isSuggestionsLoading,
  onGenerateSuggestions,
}: ToolbarLayerProps) {
  const { diagram } = useCanvasDiagram();
  const { toolbarButtons } = useCanvasEvents();

  return (
    <>
      {/* Canvas Toolbar */}
      <CanvasToolbar placement="bottom" buttons={toolbarButtons} />

      {/* Canvas Text Toolbar (right-side) */}
      <CanvasTextToolbar
        diagramType={diagram?.type}
        onGenerateSuggestions={onGenerateSuggestions}
        isSuggestionsLoading={isSuggestionsLoading}
      />
    </>
  );
}

export const ToolbarLayer = memo(ToolbarLayerComponent);

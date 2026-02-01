import { CanvasController } from './CanvasController';
import { CanvasView } from './CanvasView';

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
 * Architecture:
 * - CanvasController: Business logic layer (Context Provider)
 * - CanvasView: Presentation layer (pure rendering)
 *
 * CRITICAL: Each diagram ID gets its own isolated store instance.
 * This component can be rendered multiple times with different diagramIds
 * without any state cross-contamination.
 */

export interface CanvasProps {
  /** The diagram ID for this canvas instance */
  diagramId: string;
}

export function Canvas({ diagramId }: CanvasProps) {
  return (
    <CanvasController diagramId={diagramId}>
      <CanvasView />
    </CanvasController>
  );
}

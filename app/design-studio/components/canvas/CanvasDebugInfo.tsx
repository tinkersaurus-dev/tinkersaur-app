interface CanvasDebugInfoProps {
  diagramId: string;
  zoom: number;
  shapesCount: number;
}

/**
 * Debug information overlay for the canvas
 * Shows diagram ID, zoom level, and number of shapes
 */
export function CanvasDebugInfo({ diagramId, zoom, shapesCount }: CanvasDebugInfoProps) {
  return (
    <div className="absolute bottom-2 right-2 text-xs text-[var(--text-muted)] bg-[var(--bg)] px-2 py-1 rounded border border-[var(--border-muted)]">
      <div>Diagram: {diagramId.slice(0, 8)}...</div>
      <div>Zoom: {(zoom * 100).toFixed(0)}%</div>
      <div>Shapes: {shapesCount}</div>
    </div>
  );
}

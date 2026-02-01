import { memo } from 'react';

interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface SelectionBoxOverlayProps {
  selectionBox: SelectionBox | null;
}

/**
 * SelectionBoxOverlay Component
 *
 * Renders the selection box rectangle when the user is drag-selecting.
 * Memoized to prevent re-renders when other canvas state changes.
 */
function SelectionBoxOverlayComponent({ selectionBox }: SelectionBoxOverlayProps) {
  if (!selectionBox) {
    return null;
  }

  return (
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
  );
}

export const SelectionBoxOverlay = memo(SelectionBoxOverlayComponent);

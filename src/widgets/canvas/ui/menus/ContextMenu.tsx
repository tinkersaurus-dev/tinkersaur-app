import { ContextMenuWrapper } from './ContextMenuWrapper';

/**
 * Context Menu Component
 *
 * Displays a context menu at a specific position.
 * Auto-closes when clicking outside or pressing Escape (handled by wrapper).
 */

interface ContextMenuProps {
  /** X position in screen coordinates */
  x: number;

  /** Y position in screen coordinates */
  y: number;

  /** Whether the menu is visible */
  isOpen: boolean;

  /** Callback when menu should close */
  onClose: () => void;

  /** Callback when "Add Rectangle" is clicked */
  onAddRectangle: () => void;
}

export function ContextMenu({
  x,
  y,
  isOpen,
  onClose,
  onAddRectangle,
}: ContextMenuProps) {
  const handleAddRectangle = () => {
    onAddRectangle();
    onClose();
  };

  return (
    <ContextMenuWrapper
      menuId="canvas-context-menu"
      isOpen={isOpen}
      x={x}
      y={y}
      onClose={onClose}
      className="bg-[var(--bg-light)] border border-[var(--border)] rounded-sm [box-shadow:var(--shadow)] py-1 min-w-[160px]"
    >
      <button
        onClick={handleAddRectangle}
        className="w-full text-left px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--highlight)] transition-colors duration-[var(--transition-fast)] cursor-pointer"
      >
        Add Rectangle
      </button>

      {/* Future menu items can be added here */}
      {/* <button className="...">Add Circle</button> */}
      {/* <button className="...">Add Text</button> */}
    </ContextMenuWrapper>
  );
}

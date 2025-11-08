import { useEffect, useRef } from 'react';

/**
 * Context Menu Component
 *
 * Displays a context menu at a specific position.
 * Auto-closes when clicking outside or pressing Escape.
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
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the menu
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Small delay to prevent immediate close from the same click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddRectangle = () => {
    onAddRectangle();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-[var(--bg-light)] border border-[var(--border)] rounded-sm [box-shadow:var(--shadow)] py-1 z-50 min-w-[160px]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
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
    </div>
  );
}

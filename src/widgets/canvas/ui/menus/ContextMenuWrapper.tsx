import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

export interface ContextMenuWrapperProps {
  menuId: string;
  isOpen: boolean;
  x: number;
  y: number;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  centered?: boolean;
  anchorBottom?: boolean;
}

/**
 * Wrapper component that provides common menu behaviors:
 * - Click-outside-to-close using timestamp comparison
 * - Escape key handler
 * - Fixed positioning in screen space
 * - Context menu prevention on menu itself
 *
 * This eliminates duplicate logic across all menu components.
 */
export function ContextMenuWrapper({
  menuId,
  isOpen,
  x,
  y,
  onClose,
  children,
  className = '',
  centered = false,
  anchorBottom = false,
}: ContextMenuWrapperProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Click-outside-to-close handler
  useEffect(() => {
    if (!isOpen) return;

    // Capture the time when menu opened to ignore stale events
    // event.timeStamp uses DOMHighResTimeStamp (same origin as performance.now())
    const openedAt = performance.now();

    const handleClickOutside = (event: MouseEvent) => {
      // Ignore events that occurred before or during menu open
      if (event.timeStamp <= openedAt) return;

      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Attach listener immediately - timestamp check handles the race condition
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Escape key handler
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

  // Don't render if not open
  if (!isOpen) return null;

  // Prevent context menu on the menu itself
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Build transform for centering and bottom anchoring
  const transforms = [];
  if (centered) transforms.push('translateX(-50%)');
  if (anchorBottom) transforms.push('translateY(-100%)');
  const transform = transforms.length > 0 ? transforms.join(' ') : undefined;

  return (
    <div
      ref={menuRef}
      data-menu-id={menuId}
      className={`fixed z-50 ${className}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform,
      }}
      onContextMenu={handleContextMenu}
    >
      {children}
    </div>
  );
}

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
}

/**
 * Wrapper component that provides common menu behaviors:
 * - Click-outside-to-close with 100ms delay
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
}: ContextMenuWrapperProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Click-outside-to-close handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // 100ms delay to prevent immediate close when menu is opened by click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
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

  return (
    <div
      ref={menuRef}
      data-menu-id={menuId}
      className={`fixed z-50 ${className}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
      onContextMenu={handleContextMenu}
    >
      {children}
    </div>
  );
}

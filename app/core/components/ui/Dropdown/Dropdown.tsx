import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';

export interface DropdownMenuItem {
  key: string;
  label: ReactNode;
  type?: 'item' | 'divider';
  onClick?: () => void;
  disabled?: boolean;
}

export interface DropdownMenuProps {
  items: DropdownMenuItem[];
}

export interface DropdownProps {
  children?: ReactNode;
  menu: DropdownMenuProps;
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
  trigger?: 'click' | 'hover' | 'contextMenu';
  className?: string;
  style?: CSSProperties;
  isOpen?: boolean;
  onClose?: () => void;
  position?: { x: number; y: number };
}

export function Dropdown({
  children,
  menu,
  placement = 'bottomLeft',
  trigger = 'click',
  className = '',
  style,
  isOpen: controlledIsOpen,
  onClose,
  position: contextMenuPosition,
}: DropdownProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate menu position - use useMemo to compute immediately, not in useEffect
  const position = useMemo(() => {
    // For context menus, use provided position
    if (trigger === 'contextMenu' && contextMenuPosition) {
      return { top: contextMenuPosition.y, left: contextMenuPosition.x };
    }

    if (!triggerRef.current) return { top: 0, left: 0 };

    const rect = triggerRef.current.getBoundingClientRect();
    let top = 0;
    let left = 0;

    switch (placement) {
      case 'bottomLeft':
        top = rect.bottom + 4;
        left = rect.left;
        break;
      case 'bottomRight':
        top = rect.bottom + 4;
        left = rect.right;
        break;
      case 'topLeft':
        top = rect.top - 4;
        left = rect.left;
        break;
      case 'topRight':
        top = rect.top - 4;
        left = rect.right;
        break;
    }

    return { top, left };
  }, [placement, trigger, contextMenuPosition, isOpen]);

  // Helper to close menu
  const closeMenu = useCallback(() => {
    if (isControlled && onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  }, [isControlled, onClose]);

  // Handle click outside to close menu
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      // For context menus, only check if click is outside the menu itself
      if (trigger === 'contextMenu') {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          closeMenu();
        }
        return;
      }

      // For regular dropdowns, check both menu and trigger
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeMenu, trigger]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (trigger === 'click') {
      if (isControlled && onClose) {
        if (isOpen) {
          onClose();
        }
      } else {
        setInternalIsOpen(!isOpen);
      }
    }
  };

  const handleTriggerMouseEnter = () => {
    if (trigger === 'hover') {
      if (!isControlled) {
        setInternalIsOpen(true);
      }
    }
  };

  const handleTriggerMouseLeave = () => {
    if (trigger === 'hover') {
      setTimeout(() => {
        if (!isControlled) {
          setInternalIsOpen(false);
        }
      }, 200);
    }
  };

  const handleMenuItemClick = (item: DropdownMenuItem) => {
    if (!item.disabled && item.onClick) {
      item.onClick();
      closeMenu();
    }
  };

  const menuClasses = [
    'bg-[var(--bg-light)]',
    'border',
    'border-[var(--border)]',
    'rounded-sm',
    '[box-shadow:var(--shadow)]',
    'py-1',
    'min-w-[160px]',
  ]
    .filter(Boolean)
    .join(' ');

  const adjustedLeft =
    placement.endsWith('Right') ? position.left - 160 : position.left;

  return (
    <>
      {trigger !== 'contextMenu' && children && (
        <div
          ref={triggerRef}
          onClick={handleTriggerClick}
          onMouseEnter={handleTriggerMouseEnter}
          onMouseLeave={handleTriggerMouseLeave}
          className={className}
          style={{ display: 'inline-block', ...style }}
        >
          {children}
        </div>
      )}

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className={menuClasses}
            style={{
              position: 'fixed',
              top: `${position.top}px`,
              left: `${adjustedLeft}px`,
              zIndex: 9999,
            }}
          >
            {menu.items.map((item, index) => {
              if (item.type === 'divider') {
                return (
                  <div
                    key={`divider-${index}`}
                    className="h-px bg-[var(--border)] my-1"
                  />
                );
              }

              const itemClasses = [
                'px-2',
                'py-1',
                'text-xs',
                'transition-colors',
                item.disabled
                  ? 'text-[var(--text-disabled)] cursor-not-allowed'
                  : 'text-[var(--text)] cursor-pointer hover:bg-[var(--bg-dark)]',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <div
                  key={item.key}
                  className={itemClasses}
                  onClick={() => handleMenuItemClick(item)}
                >
                  {item.label}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}

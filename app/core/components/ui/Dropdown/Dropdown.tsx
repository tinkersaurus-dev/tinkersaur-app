import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
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
  children: ReactNode;
  menu: DropdownMenuProps;
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
  trigger?: 'click' | 'hover';
  className?: string;
  style?: CSSProperties;
}

export function Dropdown({
  children,
  menu,
  placement = 'bottomLeft',
  trigger = 'click',
  className = '',
  style,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate menu position
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;

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

    setPosition({ top, left });
  }, [placement]);

  // Handle click outside to close menu
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Update position when opened
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (trigger === 'click') {
      setIsOpen(!isOpen);
    }
  };

  const handleTriggerMouseEnter = () => {
    if (trigger === 'hover') {
      setIsOpen(true);
    }
  };

  const handleTriggerMouseLeave = () => {
    if (trigger === 'hover') {
      setTimeout(() => setIsOpen(false), 200);
    }
  };

  const handleMenuItemClick = (item: DropdownMenuItem) => {
    if (!item.disabled && item.onClick) {
      item.onClick();
      setIsOpen(false);
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
                'px-4',
                'py-2',
                'text-sm',
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

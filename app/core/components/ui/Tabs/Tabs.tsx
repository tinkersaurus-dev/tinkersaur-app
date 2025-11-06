import React, { useState } from 'react';

export interface TabItem {
  key: string;
  label: React.ReactNode;
  children: React.ReactNode;
  closable?: boolean;
  disabled?: boolean;
}

export interface TabsProps {
  // Controlled mode
  activeKey?: string;
  onChange?: (key: string) => void;

  // Uncontrolled mode
  defaultActiveKey?: string;

  // Items
  items: TabItem[];

  // Type & appearance
  type?: 'line' | 'card' | 'editable-card';

  // Edit callbacks
  onEdit?: (targetKey: string, action: 'add' | 'remove') => void;
  hideAdd?: boolean;

  // Styling
  className?: string;
  style?: React.CSSProperties;

  // Accessibility
  id?: string;
  'aria-label'?: string;
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function Tabs({
  activeKey,
  defaultActiveKey,
  onChange,
  items,
  type = 'line',
  onEdit,
  hideAdd = false,
  className = '',
  style,
  id,
  'aria-label': ariaLabel,
}: TabsProps) {
  // Internal state for uncontrolled mode
  const [internalActiveKey, setInternalActiveKey] = useState(
    defaultActiveKey || items[0]?.key
  );

  // Use controlled or uncontrolled key
  const currentActiveKey = activeKey !== undefined ? activeKey : internalActiveKey;

  // Tab selection handler
  const handleTabClick = (key: string, disabled?: boolean) => {
    if (disabled) return;

    if (activeKey === undefined) {
      setInternalActiveKey(key);
    }
    onChange?.(key);
  };

  // Close handler
  const handleClose = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    onEdit?.(key, 'remove');
  };

  // Add handler
  const handleAdd = () => {
    onEdit?.('', 'add');
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, key: string, index: number, disabled?: boolean) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTabClick(key, disabled);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      const prevTab = items[index - 1];
      handleTabClick(prevTab.key, prevTab.disabled);
      // Focus previous tab
      const prevElement = e.currentTarget.previousElementSibling as HTMLElement;
      prevElement?.focus();
    } else if (e.key === 'ArrowRight' && index < items.length - 1) {
      e.preventDefault();
      const nextTab = items[index + 1];
      handleTabClick(nextTab.key, nextTab.disabled);
      // Focus next tab
      const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
      nextElement?.focus();
    }
  };

  // Tab bar styles based on type
  const getTabBarStyles = () => {
    const base = 'flex items-center gap-1';

    if (type === 'line') {
      return cn(base, 'border-b border-[var(--border-muted)]');
    }
    if (type === 'card' || type === 'editable-card') {
      return cn(base, 'border-b border-[var(--border-muted)] bg-[var(--bg-dark)] px-2 pt-0');
    }
    return base;
  };

  // Tab item styles based on type and state
  const getTabItemStyles = (isActive: boolean, disabled?: boolean) => {
    const base = 'flex items-center gap-2 px-3 py-1 cursor-pointer transition-all relative';
    const focus = 'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1';

    if (disabled) {
      return cn(base, focus, 'opacity-50 cursor-not-allowed');
    }

    if (type === 'line') {
      if (isActive) {
        return cn(
          base,
          focus,
          'text-[var(--primary)] border-b-2 border-[var(--primary)] font-medium -mb-[1px]'
        );
      }
      return cn(
        base,
        focus,
        'text-[var(--text-muted)] hover:text-[var(--text)] border-b-2 border-transparent -mb-[1px]'
      );
    }

    if (type === 'card' || type === 'editable-card') {
      if (isActive) {
        return cn(
          base,
          focus,
          'bg-[var(--bg)] border border-[var(--border-muted)] border-b-[var(--bg)] rounded-t-sm -mb-[1px] text-[var(--text-muted)] font-medium'
        );
      }
      return cn(
        base,
        focus,
        'bg-transparent border border-transparent rounded-t-sm text-[var(--text-muted)] hover:text-[var(--text)]'
      );
    }

    return base;
  };

  // Close button styles
  const closeButtonStyles = cn(
    'ml-1 w-4 h-4 flex items-center justify-center rounded',
    'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-muted)]',
    'transition-colors'
  );

  // Add button styles
  const addButtonStyles = cn(
    'px-3 py-2 rounded-t-md border border-[var(--border)] border-b-transparent',
    'bg-white text-[var(--text-muted)] hover:text-[var(--primary)]',
    'transition-colors cursor-pointer -mb-[1px]',
    'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1'
  );

  // Find active item for content rendering
  const activeItem = items.find((item) => item.key === currentActiveKey);

  return (
    <div
      id={id}
      className={cn('flex flex-col', style?.height !== undefined && style?.height !== 0 && 'h-full', className)}
      style={style}
    >
      {/* Tab Bar */}
      <div
        className={getTabBarStyles()}
        role="tablist"
        aria-label={ariaLabel || 'Tabs'}
      >
        {items.map((item, index) => (
          <div
            key={item.key}
            role="tab"
            aria-selected={item.key === currentActiveKey}
            aria-controls={`tabpanel-${item.key}`}
            aria-disabled={item.disabled}
            tabIndex={item.key === currentActiveKey ? 0 : -1}
            className={getTabItemStyles(item.key === currentActiveKey, item.disabled)}
            onClick={() => handleTabClick(item.key, item.disabled)}
            onKeyDown={(e) => handleKeyDown(e, item.key, index, item.disabled)}
          >
            <span>{item.label}</span>
            {item.closable && type === 'editable-card' && !item.disabled && (
              <button
                className={closeButtonStyles}
                onClick={(e) => handleClose(e, item.key)}
                aria-label={`Close ${item.label}`}
                tabIndex={-1}
              >
                ×
              </button>
            )}
          </div>
        ))}

        {/* Add button for editable-card type */}
        {!hideAdd && type === 'editable-card' && (
          <button
            className={addButtonStyles}
            onClick={handleAdd}
            aria-label="Add tab"
            tabIndex={0}
          >
            +
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div
        className="flex-1 overflow-auto"
        role="tabpanel"
        id={`tabpanel-${currentActiveKey}`}
        aria-labelledby={`tab-${currentActiveKey}`}
      >
        {activeItem?.children}
      </div>
    </div>
  );
}

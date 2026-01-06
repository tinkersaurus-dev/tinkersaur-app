import type { CSSProperties, ReactNode } from 'react';

export interface MenuItemType {
  key: string;
  label: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

export interface MenuProps {
  items: MenuItemType[];
  selectedKeys?: string[];
  mode?: 'horizontal' | 'vertical';
  colorScheme?: 'app' | 'brand';
  className?: string;
  style?: CSSProperties;
}

const colorSchemeStyles = {
  app: {
    text: 'text-[var(--text-muted)]',
    textHover: 'hover:text-[var(--primary)]',
    textSelected: 'text-[var(--primary)]',
    indicatorHorizontal: 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[var(--primary)]',
    indicatorVertical: 'border-l-2 border-[var(--primary)]',
    bgSelected: 'bg-[var(--bg-light)]',
    bgHover: 'hover:bg-[var(--bg-brand-hover)]',
  },
  brand: {
    text: 'text-[var(--text-brand)]',
    textHover: 'hover:text-[var(--text-brand)]',
    textSelected: 'text-[var(--text-brand-selected)]',
    indicatorHorizontal: 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[var(--text-brand-selected)]',
    indicatorVertical: 'border-l-2 border-[var(--text-brand)]',
    bgSelected: 'bg-[var(--bg-brand)]',
    bgHover: 'hover:bg-[var(--bg-brand-hover)]',
  },
} as const;

export function Menu({
  items,
  selectedKeys = [],
  mode = 'horizontal',
  colorScheme = 'app',
  className = '',
  style,
}: MenuProps) {
  const isHorizontal = mode === 'horizontal';
  const colors = colorSchemeStyles[colorScheme];

  const containerClasses = [
    'flex',
    isHorizontal ? 'flex-row' : 'flex-col',
    isHorizontal ? 'gap-1' : 'gap-0',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <nav className={containerClasses} style={style} role="menubar">
      {items.map((item) => {
        const isSelected = selectedKeys.includes(item.key);
        const isDisabled = item.disabled;

        const itemClasses = [
          'transition-colors',
          'relative',
          'whitespace-nowrap',
          // Base text color and cursor
          isDisabled
            ? 'text-[var(--text-disabled)] cursor-not-allowed'
            : 'cursor-pointer',
          // Text colors
          !isDisabled && !isSelected && `${colors.text} ${colors.textHover} ${colors.bgHover}`,
          !isDisabled && isSelected && colors.textSelected,
          // Selected indicator (bottom border for horizontal, left border for vertical)
          isSelected && isHorizontal && colors.indicatorHorizontal,
          isSelected && !isHorizontal && `${colors.indicatorVertical} ${colors.bgSelected}`,
        ]
          .filter(Boolean)
          .join(' ');

        const handleClick = () => {
          if (!isDisabled && item.onClick) {
            item.onClick();
          }
        };

        return (
          <div
            key={item.key}
            className={itemClasses}
            onClick={handleClick}
            role="menuitem"
            aria-disabled={isDisabled}
            aria-current={isSelected ? 'page' : undefined}
          >
            <span className="block px-4 py-2 [&>a]:block [&>a]:px-4 [&>a]:py-2 [&>a]:-mx-4 [&>a]:-my-2 [&>a]:text-inherit [&>a]:no-underline">
              {item.label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}

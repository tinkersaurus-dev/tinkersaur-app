import type { CSSProperties, ReactNode } from 'react';

export interface LayoutSiderProps {
  children: ReactNode;
  width?: number | string;
  className?: string;
  style?: CSSProperties;
}

export function LayoutSider({
  children,
  width = 200,
  className = '',
  style,
}: LayoutSiderProps) {
  const classes = [
    'flex-shrink-0',
    'bg-[var(--bg-dark)]',
    'border-r',
    'border-[var(--border)]',
    'overflow-auto',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const siderStyle: CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    ...style,
  };

  return (
    <aside className={classes} style={siderStyle}>
      {children}
    </aside>
  );
}

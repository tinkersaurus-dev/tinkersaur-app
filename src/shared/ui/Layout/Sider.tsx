import type { CSSProperties, ReactNode } from 'react';

export interface LayoutSiderProps {
  children: ReactNode;
  width?: number | string;
  collapsedWidth?: number;
  collapsed?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function LayoutSider({
  children,
  width = 200,
  collapsedWidth = 48,
  collapsed = false,
  className = '',
  style,
}: LayoutSiderProps) {
  const classes = [
    'flex-shrink-0',
    'overflow-hidden',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const resolvedWidth = collapsed
    ? typeof collapsedWidth === 'number'
      ? `${collapsedWidth}px`
      : collapsedWidth
    : typeof width === 'number'
      ? `${width}px`
      : width;

  const siderStyle: CSSProperties = {
    width: resolvedWidth,
    transition: 'width 600ms cubic-bezier(0.4, 0, 0.2, 1)',
    ...style,
  };

  return (
    <aside className={classes} style={siderStyle}>
      {children}
    </aside>
  );
}

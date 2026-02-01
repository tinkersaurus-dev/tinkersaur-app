import type { CSSProperties, ReactNode } from 'react';

export interface LayoutHeaderProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function LayoutHeader({
  children,
  className = '',
  style,
}: LayoutHeaderProps) {
  const classes = [
    'h-12',
    'flex',
    'items-center',
    'px-6',
    'flex-shrink-0',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={classes} style={style}>
      {children}
    </header>
  );
}

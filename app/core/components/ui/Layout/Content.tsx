import type { CSSProperties, ReactNode } from 'react';

export interface LayoutContentProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function LayoutContent({
  children,
  className = '',
  style,
}: LayoutContentProps) {
  const classes = [
    'flex-1',
    'overflow-auto',
    'bg-[var(--bg-dark)]',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <main className={classes} style={style}>
      {children}
    </main>
  );
}

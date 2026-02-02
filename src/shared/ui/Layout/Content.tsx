import type { CSSProperties, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

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
  const classes = twMerge(
    'flex-1',
    'min-h-0',
    'flex',
    'flex-col',
    'overflow-auto',
    'bg-[var(--bg)]',
    className,
  );

  return (
    <main className={classes} style={style}>
      {children}
    </main>
  );
}

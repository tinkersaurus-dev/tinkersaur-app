import type { CSSProperties, ReactNode } from 'react';

export interface LayoutProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Layout({ children, className = '', style }: LayoutProps) {
  const classes = ['flex', 'flex-col', 'min-h-screen', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
}

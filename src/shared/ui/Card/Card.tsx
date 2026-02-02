/**
 * Card Component
 * Custom card with Tailwind styles and theme support
 */

import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  bordered?: boolean;
  shadow?: boolean;
  hoverable?: boolean;
  children?: ReactNode;
  contentClassName?: string;
}

export function Card({
  title,
  bordered = true,
  shadow = true,
  hoverable = false,
  children,
  className,
  contentClassName = 'p-6',
  style,
  ...props
}: CardProps) {
  // Base styles
  const baseStyles = 'bg-[var(--bg-light)] rounded-[2px] overflow-hidden transition-all duration-base';

  // Border styles
  const borderStyles = bordered ? 'border border-[var(--border)]' : '';

  // Shadow styles
  const shadowStyles = shadow ? '[box-shadow:var(--shadow)]' : '';

  // Hover styles
  const hoverStyles = hoverable ? 'hover:[box-shadow:var(--shadow-hover)] hover:border-[var(--primary)] cursor-pointer' : '';

  // Combine card styles - cn() merges classes intelligently, so className can override defaults
  const cardClassName = cn(
    baseStyles,
    borderStyles,
    shadowStyles,
    hoverStyles,
    className,
  );
  
  const titleBaseStyles = 'px-6 py-4 bg-[var(--bg)]';

  const titleBorderStyles = bordered ? 'border-b border-[var(--border-muted)]' : '';

  const cardTitleClassName = [
    titleBaseStyles,
    titleBorderStyles,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClassName}
      style={style}
      {...props}
    >
      {title && (
        <div className={cardTitleClassName}>
          <div className="text-lg leading-normal font-medium text-[var(--text)]">
            {title}
          </div>
        </div>
      )}
      <div className={contentClassName}>
        {children}
      </div>
    </div>
  );
}

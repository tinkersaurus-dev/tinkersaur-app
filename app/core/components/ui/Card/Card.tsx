/**
 * Card Component
 * Custom card with Tailwind styles and theme support
 */

import type { ReactNode, HTMLAttributes } from 'react';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  bordered?: boolean;
  hoverable?: boolean;
  children?: ReactNode;
}

export function Card({
  title,
  bordered = true,
  hoverable = false,
  children,
  className = '',
  style,
  ...props
}: CardProps) {
  // Base styles
  const baseStyles = 'bg-[var(--bg-light)] rounded-[5px] overflow-hidden transition-all duration-base';

  // Border styles
  const borderStyles = bordered ? 'border border-[var(--border-muted)]' : '';

  // Shadow styles
  const shadowStyles = '[box-shadow:var(--shadow)]';

  // Hover styles
  const hoverStyles = hoverable ? 'hover:[box-shadow:var(--shadow-hover)] hover:border-[var(--border)] cursor-pointer' : '';

  // Combine card styles
  const cardClassName = [
    baseStyles,
    borderStyles,
    shadowStyles,
    hoverStyles,
    className,
  ].filter(Boolean).join(' ');
  
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
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

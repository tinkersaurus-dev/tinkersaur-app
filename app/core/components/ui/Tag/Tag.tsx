/**
 * Tag Component
 * Custom tag/badge with color variants and theme support
 */

import type { ReactNode, HTMLAttributes } from 'react';

export type TagColor = 'default' | 'blue' | 'green' | 'orange' | 'red' | 'purple';

export interface TagProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  color?: TagColor;
  children?: ReactNode;
}

export function Tag({
  color = 'default',
  children,
  className = '',
  ...props
}: TagProps) {
  // Base styles - using typography tokens
  const baseStyles = 'inline-flex items-center px-2 py-0.5 text-[var(--typography-caption-size)] leading-[var(--typography-caption-line-height)] font-[var(--typography-caption-weight)] rounded-sm';

  // Color styles - using color-specific backgrounds and text
  const colorStyles: Record<TagColor, string> = {
    default: 'bg-[var(--bg)] text-[var(--text)] border border-[var(--border-muted)]',
    blue: 'bg-[var(--tag-bg-blue)] text-[var(--tag-blue)] border border-[var(--tag-blue)]',
    green: 'bg-[var(--tag-bg-green)] text-[var(--tag-green)] border border-[var(--tag-green)]',
    orange: 'bg-[var(--tag-bg-orange)] text-[var(--tag-orange)] border border-[var(--tag-orange)]',
    red: 'bg-[var(--tag-bg-red)] text-[var(--tag-red)] border border-[var(--tag-red)]',
    purple: 'bg-[var(--tag-bg-purple)] text-[var(--tag-purple)] border border-[var(--tag-purple)]',
  };

  // Combine styles
  const tagClassName = [
    baseStyles,
    colorStyles[color],
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={tagClassName} {...props}>
      {children}
    </span>
  );
}

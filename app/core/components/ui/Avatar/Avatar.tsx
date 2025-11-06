import type { CSSProperties, ReactNode } from 'react';

export interface AvatarProps {
  size?: 'small' | 'medium' | 'large';
  icon?: ReactNode;
  src?: string;
  alt?: string;
  children?: ReactNode; // For initials or fallback text
  className?: string;
  style?: CSSProperties;
}

const sizeMap = {
  small: 'w-6 h-6 text-xs',
  medium: 'w-8 h-8 text-sm',
  large: 'w-10 h-10 text-base',
};

export function Avatar({
  size = 'medium',
  icon,
  src,
  alt = 'Avatar',
  children,
  className = '',
  style,
}: AvatarProps) {
  const sizeClass = sizeMap[size];

  const classes = [
    'inline-flex',
    'items-center',
    'justify-center',
    'rounded-full',
    'bg-[var(--color-bg-light)]',
    'text-[var(--color-text-muted)]',
    'overflow-hidden',
    'flex-shrink-0',
    sizeClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // If image source is provided, render image
  if (src) {
    return (
      <div className={classes} style={style}>
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      </div>
    );
  }

  // Otherwise render icon or text
  return (
    <div className={classes} style={style}>
      {icon || children}
    </div>
  );
}

/**
 * Button Component
 * Custom button with Tailwind styles and theme support
 */

import type { ReactNode, MouseEvent } from 'react';

export interface ButtonProps {
  variant?: 'primary' | 'default' | 'text' | 'link' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  children?: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export function Button({
  variant = 'default',
  size = 'small',
  disabled = false,
  loading = false,
  icon,
  onClick,
  children,
  type = 'button',
  className = '',
}: ButtonProps) {
  // Base styles
  const baseStyles = 'inline-flex items-center justify-center gap-2 transition-all duration-base rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2';

  // Size styles - using typography tokens
  const sizeStyles = {
    small: 'px-3 py-1.5 text-[var(--font-size-sm)] leading-[var(--line-height-normal)] font-[var(--font-weight-medium)] h-6',
    medium: 'px-4 py-1.5 text-[var(--typography-button-size)] leading-[var(--typography-button-line-height)] font-[var(--typography-button-weight)] h-8',
    large: 'px-6 py-2 text-[var(--font-size-lg)] leading-[var(--line-height-normal)] font-[var(--font-weight-medium)] h-10',
  };

  // Variant styles
  const variantStyles = {
    primary: 'bg-[var(--primary)] hover:bg-[var(--secondary)] active:bg-[var(--primary)] text-[var(--text-button)] focus:ring-[var(--secondary)]',
    default: 'bg-white border border-[var(--primary)] hover:border-[var(--secondary)] hover:text-[var(--secondary)] text-[var(--primary)] focus:ring-[var(--color-secondary)]',
    danger: 'bg-[var(--danger)] hover:bg-[var(--danger)]/90 active:bg-[var(--danger)]/80 text-[var(--text-button)] focus:ring-[var(--danger)]',
    text: 'bg-transparent hover:bg-[var(--primary)] text-[var(--primary)] hover:text-[var(--text-button)] focus:ring-[var(--primary)]',
    link: 'bg-transparent hover:text-[var(--primary)] text-[var(--primary)] focus:ring-transparent underline-offset-2 hover:underline',
  };

  // Disabled styles
  const disabledStyles = 'opacity-40 cursor-not-allowed';

  // Loading styles
  const loadingStyles = 'opacity-60 cursor-wait';

  // Combine styles
  const buttonClassName = [
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    disabled ? disabledStyles : '',
    loading ? loadingStyles : '',
    className,
  ].filter(Boolean).join(' ');

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <button
      type={type}
      className={buttonClassName}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading && (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {!loading && icon && <span className="inline-flex items-center">{icon}</span>}
      {children}
    </button>
  );
}

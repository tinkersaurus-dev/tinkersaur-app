/**
 * DatePicker Component
 * Custom date/datetime input with Tailwind styles and theme support
 */

import type { InputHTMLAttributes } from 'react';

export interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  size?: 'small' | 'medium' | 'large';
  error?: boolean;
  /** Whether to include time selection */
  showTime?: boolean;
}

export function DatePicker({
  size = 'medium',
  error = false,
  showTime = false,
  className = '',
  disabled = false,
  ...props
}: DatePickerProps) {
  // Base styles
  const baseStyles = 'w-full border rounded-sm transition-all duration-base focus:outline-none focus:ring-2 focus:ring-offset-0';

  // Size styles
  const sizeStyles = {
    small: 'px-2 py-1 text-xs leading-normal h-6',
    medium: 'px-3 py-1.5 text-base leading-normal h-9',
    large: 'px-4 py-2 text-lg leading-normal h-11',
  };

  // State styles
  const stateStyles = error
    ? 'border-[var(--danger)] text-[var(--danger)] focus:ring-[var(--danger)] focus:border-[var(--danger)]'
    : 'border-[var(--border-muted)] hover:border-[var(--primary)] text-[var(--text)] ring-opacity-20 focus:border-[var(--primary)]';

  // Disabled styles
  const disabledStyles = disabled
    ? 'bg-[var(--bg)] cursor-not-allowed opacity-60'
    : 'bg-[var(--bg-light)]';

  // Combine styles
  const inputClassName = [
    baseStyles,
    sizeStyles[size],
    stateStyles,
    disabledStyles,
    className,
  ].filter(Boolean).join(' ');

  return (
    <input
      type={showTime ? 'datetime-local' : 'date'}
      className={inputClassName}
      disabled={disabled}
      {...props}
    />
  );
}

/**
 * Checkbox Component
 * Custom checkbox with Tailwind styles and theme support
 */

import type { InputHTMLAttributes } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  size?: 'small' | 'medium' | 'large';
  label?: string;
  error?: boolean;
  indeterminate?: boolean;
}

export function Checkbox({
  size = 'medium',
  label,
  error = false,
  indeterminate = false,
  className = '',
  disabled = false,
  id,
  ...props
}: CheckboxProps) {
  // Size styles for the checkbox
  const sizeStyles = {
    small: 'w-3.5 h-3.5',
    medium: 'w-4 h-4',
    large: 'w-5 h-5',
  };

  // Label size styles
  const labelSizeStyles = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-md',
  };

  // Base checkbox styles
  const checkboxStyles = [
    sizeStyles[size],
    'rounded',
    'border-[var(--border)]',
    'cursor-pointer',
    'accent-[var(--primary)]',
    'transition-all',
    'duration-base',
    error ? 'border-[var(--danger)] accent-[var(--danger)]' : '',
    disabled ? 'cursor-not-allowed opacity-60' : '',
    className,
  ].filter(Boolean).join(' ');

  // Handle indeterminate state via ref
  const checkboxRef = (el: HTMLInputElement | null) => {
    if (el) {
      el.indeterminate = indeterminate;
    }
  };

  const checkbox = (
    <input
      ref={checkboxRef}
      type="checkbox"
      id={id}
      className={checkboxStyles}
      disabled={disabled}
      {...props}
    />
  );

  if (label) {
    return (
      <label
        htmlFor={id}
        className={`inline-flex items-center gap-2 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        {checkbox}
        <span className={`${labelSizeStyles[size]} text-[var(--text)]`}>{label}</span>
      </label>
    );
  }

  return checkbox;
}

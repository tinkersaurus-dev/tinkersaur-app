/**
 * Input Component
 * Custom input with Tailwind styles and theme support
 */

import type { TextareaHTMLAttributes, InputHTMLAttributes } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'small' | 'medium' | 'large';
  error?: boolean;
}

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  size?: 'small' | 'medium' | 'large';
  error?: boolean;
}

export function Input({
  size = 'medium',
  error = false,
  className = '',
  disabled = false,
  ...props
}: InputProps) {
  // Base styles
  const baseStyles = 'w-full border rounded-sm transition-all duration-base focus:outline-none focus:ring-2 focus:ring-offset-0 placeholder:text-[var(--text-disabled)]';

  // Size styles
  const sizeStyles = {
    small: 'px-2 py-1 text-xs leading-normal h-6',
    medium: 'px-3 py-1.5 text-sm leading-normal h-9',
    large: 'px-4 py-2 text-md leading-normal h-11',
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
      className={inputClassName}
      disabled={disabled}
      {...props}
    />
  );
}

function TextArea({
  size = 'medium',
  error = false,
  className = '',
  disabled = false,
  rows = 4,
  ...props
}: TextAreaProps) {
  // Base styles
  const baseStyles = 'w-full border rounded-sm transition-all duration-base focus:outline-none focus:ring-2 focus:ring-offset-0 placeholder:text-[var(--text-disabled)] resize-y';

  // Size styles (affects padding and text size, not height - that's controlled by rows)
  const sizeStyles = {
    small: 'px-2 py-1 text-xs leading-normal',
    medium: 'px-3 py-1.5 text-sm leading-normal',
    large: 'px-4 py-2 text-md leading-normal',
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
  const textareaClassName = [
    baseStyles,
    sizeStyles[size],
    stateStyles,
    disabledStyles,
    className,
  ].filter(Boolean).join(' ');

  return (
    <textarea
      className={textareaClassName}
      disabled={disabled}
      rows={rows}
      {...props}
    />
  );
}

// Attach TextArea as a property to maintain Input.TextArea API
Input.TextArea = TextArea;

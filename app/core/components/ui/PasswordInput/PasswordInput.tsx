/**
 * PasswordInput Component
 * Input with show/hide password toggle
 */

import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  size?: 'small' | 'medium' | 'large';
  error?: boolean;
}

export function PasswordInput({
  size = 'medium',
  error = false,
  className = '',
  disabled = false,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  // Base styles
  const baseStyles = 'w-full border rounded-sm transition-all duration-base focus:outline-none focus:ring-2 focus:ring-offset-0 placeholder:text-[var(--text-disabled)] pr-10';

  // Size styles
  const sizeStyles = {
    small: 'px-2 py-1 text-sm leading-normal h-6',
    medium: 'px-3 py-1.5 text-base leading-normal h-9',
    large: 'px-4 py-2 text-lg leading-normal h-11',
  };

  // State styles
  const stateStyles = error
    ? 'border-[var(--danger)] text-[var(--danger)] focus:ring-[var(--danger)] focus:border-[var(--danger)]'
    : 'border-[var(--border-muted)] hover:border-[var(--border)] text-[var(--text)] focus:ring-[var(--border-muted)] focus:border-[var(--border)]';

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

  // Button position based on size
  const buttonPositionStyles = {
    small: 'top-1 right-2',
    medium: 'top-2 right-3',
    large: 'top-2.5 right-4',
  };

  return (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        className={inputClassName}
        disabled={disabled}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        disabled={disabled}
        className={`absolute ${buttonPositionStyles[size]} text-[var(--text-muted)] hover:text-[var(--text)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed`}
        tabIndex={-1}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? (
          // Eye-off icon
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          // Eye icon
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

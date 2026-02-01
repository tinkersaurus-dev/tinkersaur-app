/**
 * SearchInput Component
 * Input with integrated search icon and optional clear button
 */

import type { InputHTMLAttributes } from 'react';
import { LuSearch, LuX } from 'react-icons/lu';

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  size?: 'small' | 'medium' | 'large';
  error?: boolean;
  onClear?: () => void;
  showClearButton?: boolean;
}

export function SearchInput({
  size = 'medium',
  error = false,
  className = '',
  disabled = false,
  value,
  onClear,
  showClearButton = true,
  ...props
}: SearchInputProps) {
  // Size styles for the input
  const sizeStyles = {
    small: 'h-6 pl-7 pr-7 text-sm',
    medium: 'h-9 pl-9 pr-9 text-base',
    large: 'h-11 pl-11 pr-11 text-lg',
  };

  // Icon size styles
  const iconSizeStyles = {
    small: 'w-3.5 h-3.5',
    medium: 'w-4 h-4',
    large: 'w-5 h-5',
  };

  // Icon position styles
  const iconPositionStyles = {
    small: 'left-2',
    medium: 'left-3',
    large: 'left-3.5',
  };

  const clearPositionStyles = {
    small: 'right-2',
    medium: 'right-3',
    large: 'right-3.5',
  };

  // Base styles
  const baseStyles = 'w-full border rounded-[var(--radius-sm)] transition-all duration-base focus:outline-none focus:ring-2 focus:ring-offset-0 placeholder:text-[var(--text-disabled)] placeholder:italic placeholder:text-xs';

  // State styles
  const stateStyles = error
    ? 'border-[var(--danger)] text-[var(--danger)] focus:ring-[var(--danger)] focus:border-[var(--danger)]'
    : 'border-[var(--border)] hover:border-[var(--primary)] text-[var(--text)] focus:ring-[var(--primary)] focus:ring-opacity-20 focus:border-[var(--primary)]';

  // Disabled styles
  const disabledStyles = disabled
    ? 'bg-[var(--bg)] cursor-not-allowed opacity-60'
    : 'bg-[var(--bg)]';

  // Combine styles
  const inputClassName = [
    baseStyles,
    sizeStyles[size],
    stateStyles,
    disabledStyles,
    className,
  ].filter(Boolean).join(' ');

  const hasValue = value !== undefined && value !== '';
  const showClear = showClearButton && hasValue && onClear && !disabled;

  return (
    <div className="relative">
      <LuSearch
        className={`absolute ${iconPositionStyles[size]} top-1/2 -translate-y-1/2 ${iconSizeStyles[size]} text-[var(--text-muted)] pointer-events-none`}
      />
      <input
        type="text"
        className={inputClassName}
        disabled={disabled}
        value={value}
        {...props}
      />
      {showClear && (
        <button
          type="button"
          onClick={onClear}
          className={`absolute ${clearPositionStyles[size]} top-1/2 -translate-y-1/2 ${iconSizeStyles[size]} text-[var(--text-muted)] hover:text-[var(--text)] transition-colors`}
          tabIndex={-1}
        >
          <LuX className={iconSizeStyles[size]} />
        </button>
      )}
    </div>
  );
}

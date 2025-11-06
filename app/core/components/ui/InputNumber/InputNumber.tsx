/**
 * InputNumber Component
 * Custom numeric input with increment/decrement controls and theme support
 */

import { useState, useEffect, type ChangeEvent, type KeyboardEvent, type InputHTMLAttributes } from 'react';
import { HiMinus, HiPlus } from 'react-icons/hi';

export interface InputNumberProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'> {
  size?: 'small' | 'medium' | 'large';
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number | null) => void;
  error?: boolean;
}

export function InputNumber({
  size = 'small',
  min,
  max,
  step = 1,
  value: controlledValue,
  defaultValue,
  onChange,
  error = false,
  disabled = false,
  className = '',
  style,
  ...props
}: InputNumberProps) {
  const [internalValue, setInternalValue] = useState<string>(
    controlledValue?.toString() ?? defaultValue?.toString() ?? ''
  );

  // Sync with controlled value
  useEffect(() => {
    if (controlledValue !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInternalValue(controlledValue.toString());
    }
  }, [controlledValue]);

  const clampValue = (num: number): number => {
    let clamped = num;
    if (min !== undefined && clamped < min) clamped = min;
    if (max !== undefined && clamped > max) clamped = max;
    return clamped;
  };

  const parseValue = (str: string): number | null => {
    if (str === '' || str === '-') return null;
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Allow empty, minus sign, and valid numbers
    if (newValue === '' || newValue === '-' || !isNaN(parseFloat(newValue))) {
      setInternalValue(newValue);

      const numValue = parseValue(newValue);
      if (numValue !== null) {
        const clamped = clampValue(numValue);
        onChange?.(clamped);
      } else {
        onChange?.(null);
      }
    }
  };

  const handleBlur = () => {
    const numValue = parseValue(internalValue);
    if (numValue !== null) {
      const clamped = clampValue(numValue);
      setInternalValue(clamped.toString());
      onChange?.(clamped);
    } else if (internalValue === '' || internalValue === '-') {
      setInternalValue('');
      onChange?.(null);
    }
  };

  const handleIncrement = () => {
    if (disabled) return;
    const current = parseValue(internalValue) ?? 0;
    const newValue = clampValue(current + step);
    setInternalValue(newValue.toString());
    onChange?.(newValue);
  };

  const handleDecrement = () => {
    if (disabled) return;
    const current = parseValue(internalValue) ?? 0;
    const newValue = clampValue(current - step);
    setInternalValue(newValue.toString());
    onChange?.(newValue);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrement();
    }
  };

  // Base styles for the container
  const containerBaseStyles = 'inline-flex items-stretch w-full border rounded-sm transition-all duration-base overflow-hidden';

  // Size styles for container height
  const containerSizeStyles = {
    small: 'h-6',
    medium: 'h-9',
    large: 'h-11',
  };

  // State styles for container
  const containerStateStyles = error
    ? 'border-[var(--danger)] text-[var(--danger)] focus-within:ring-2 focus-within:ring-[var(--danger)] focus-within:border-[var(--danger)]'
    : 'border-[var(--border-muted)] hover:border-[var(--border)] text-[var(--text)] focus-within:ring-2 focus-within:ring-[var(--border-muted)] focus-within:border-[var(--border)]';

  // Disabled styles for container
  const containerDisabledStyles = disabled
    ? 'bg-[var(--bg)] cursor-not-allowed opacity-60'
    : 'bg-[var(--bg-light)]';

  // Combine container styles
  const containerClassName = [
    containerBaseStyles,
    containerSizeStyles[size],
    containerStateStyles,
    containerDisabledStyles,
    className,
  ].filter(Boolean).join(' ');

  // Input styles
  const inputBaseStyles = 'flex-1 px-3 text-[var(--text)] bg-transparent border-none outline-none text-center';
  const inputSizeStyles = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };
  const inputClassName = [inputBaseStyles, inputSizeStyles[size]].join(' ');

  // Button styles
  const buttonBaseStyles = 'flex items-center justify-center border-none bg-transparent text-[var(--text)] hover:text-[var(--text-button)] hover:bg-[var(--primary)] transition-all duration-base cursor-pointer';
  const buttonSizeStyles = {
    small: 'w-6 text-xs',
    medium: 'w-8 text-sm',
    large: 'w-10 text-base',
  };
  const buttonDisabledStyles = disabled ? 'cursor-not-allowed opacity-60' : '';
  const buttonClassName = [buttonBaseStyles, buttonSizeStyles[size], buttonDisabledStyles].filter(Boolean).join(' ');

  const isDecrementDisabled = disabled || (min !== undefined && parseValue(internalValue) !== null && parseValue(internalValue)! <= min);
  const isIncrementDisabled = disabled || (max !== undefined && parseValue(internalValue) !== null && parseValue(internalValue)! >= max);

  return (
    <div className={containerClassName} style={style}>
      <button
        type="button"
        className={buttonClassName}
        onClick={handleDecrement}
        disabled={isDecrementDisabled}
        tabIndex={-1}
      >
        <HiMinus />
      </button>
      <input
        type="text"
        inputMode="numeric"
        className={inputClassName}
        value={internalValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        {...props}
      />
      <button
        type="button"
        className={buttonClassName}
        onClick={handleIncrement}
        disabled={isIncrementDisabled}
        tabIndex={-1}
      >
        <HiPlus />
      </button>
    </div>
  );
}

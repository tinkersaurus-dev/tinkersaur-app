/**
 * DatePicker Component
 * Custom date picker with calendar dropdown using floating-ui
 */

import { useState, useMemo } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager,
} from '@floating-ui/react';
import { format, parse, isValid, startOfDay, setHours, setMinutes } from 'date-fns';
import { LuCalendar } from 'react-icons/lu';
import { CalendarGrid } from './CalendarGrid';
import { TimePicker } from './TimePicker';

export interface DatePickerProps {
  /** ISO date string value (YYYY-MM-DD or YYYY-MM-DDTHH:mm) */
  value?: string;
  /** Default value for uncontrolled mode */
  defaultValue?: string;
  /** Callback when date changes - receives ISO string */
  onChange?: (value: string) => void;
  /** Placeholder text when no date selected */
  placeholder?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show error styling */
  error?: boolean;
  /** Whether to include time selection */
  showTime?: boolean;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Additional CSS classes */
  className?: string;
  /** Input ID for label association */
  id?: string;
}

/**
 * Parse an ISO date string to a Date object
 */
function parseISODate(value: string | undefined): Date | null {
  if (!value) return null;

  // Try parsing as datetime first (YYYY-MM-DDTHH:mm)
  let date = parse(value, "yyyy-MM-dd'T'HH:mm", new Date());
  if (isValid(date)) return date;

  // Try parsing as date only (YYYY-MM-DD)
  date = parse(value, 'yyyy-MM-dd', new Date());
  if (isValid(date)) return date;

  return null;
}

/**
 * Format a Date to ISO string
 */
function formatToISO(date: Date, includeTime: boolean): string {
  if (includeTime) {
    return format(date, "yyyy-MM-dd'T'HH:mm");
  }
  return format(date, 'yyyy-MM-dd');
}

/**
 * Format a Date for display
 */
function formatForDisplay(date: Date | null, includeTime: boolean): string {
  if (!date) return '';
  if (includeTime) {
    return format(date, 'MMM d, yyyy h:mm a');
  }
  return format(date, 'MMM d, yyyy');
}

export function DatePicker({
  value: controlledValue,
  defaultValue,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  size = 'small',
  error = false,
  showTime = false,
  minDate,
  maxDate,
  className = '',
  id,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue || '');

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const selectedDate = useMemo(() => parseISODate(value), [value]);
  const [viewMonth, setViewMonth] = useState(() => selectedDate || new Date());

  // Floating UI setup
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(4), flip({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  // Handle date selection from calendar
  const handleSelectDate = (date: Date) => {
    let newDate = startOfDay(date);

    // Preserve existing time if showTime is enabled
    if (showTime && selectedDate) {
      newDate = setHours(newDate, selectedDate.getHours());
      newDate = setMinutes(newDate, selectedDate.getMinutes());
    }

    const newValue = formatToISO(newDate, showTime);

    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);

    // Close dropdown after selection (unless showTime, then wait for time selection)
    if (!showTime) {
      setIsOpen(false);
    }
  };

  // Handle time change
  const handleTimeChange = (hours: number, minutes: number) => {
    const baseDate = selectedDate || new Date();
    let newDate = startOfDay(baseDate);
    newDate = setHours(newDate, hours);
    newDate = setMinutes(newDate, minutes);

    const newValue = formatToISO(newDate, true);

    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  // Handle "Today" quick action
  const handleToday = () => {
    const today = new Date();
    handleSelectDate(today);
    setViewMonth(today);
  };

  // Handle "Clear" action
  const handleClear = () => {
    if (controlledValue === undefined) {
      setInternalValue('');
    }
    onChange?.('');
    setIsOpen(false);
  };

  // Size styles matching Input/Select components
  const sizeStyles = {
    small: 'h-6 text-xs px-2',
    medium: 'h-9 text-sm px-3',
    large: 'h-11 text-md px-4',
  };

  const triggerStyles = `
    w-full flex items-center justify-between
    bg-[var(--bg-light)]
    border border-[var(--border-muted)]
    rounded-sm
    cursor-pointer
    transition-all duration-[var(--transition-base)]
    ${sizeStyles[size]}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[var(--primary)]'}
    ${error ? 'border-[var(--danger)]' : ''}
    ${isOpen ? 'border-[var(--primary)] ring-2 ring-[var(--primary)] ring-opacity-20' : ''}
    ${className}
  `.trim();

  const dropdownStyles = `
    bg-[var(--bg-light)]
    border border-[var(--border-muted)]
    rounded-sm
    shadow-[var(--shadow)]
    z-50
  `.trim();

  const displayValue = formatForDisplay(selectedDate, showTime);
  const currentHours = selectedDate?.getHours() || 0;
  const currentMinutes = selectedDate?.getMinutes() || 0;

  return (
    <>
      <div
        ref={refs.setReference}
        id={id}
        className={triggerStyles}
        {...getReferenceProps()}
        aria-disabled={disabled}
        role="button"
        tabIndex={disabled ? -1 : 0}
      >
        <span className={displayValue ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}>
          {displayValue || placeholder}
        </span>
        <LuCalendar className="w-4 h-4 text-[var(--text-muted)]" />
      </div>

      {isOpen && !disabled && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className={dropdownStyles}
              {...getFloatingProps()}
            >
              {/* Calendar grid */}
              <CalendarGrid
                currentMonth={viewMonth}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                onMonthChange={setViewMonth}
                minDate={minDate}
                maxDate={maxDate}
              />

              {/* Time picker (if showTime) */}
              {showTime && (
                <TimePicker
                  hours={currentHours}
                  minutes={currentMinutes}
                  onChange={handleTimeChange}
                  disabled={!selectedDate}
                />
              )}

              {/* Quick actions */}
              <div className="flex items-center justify-between px-2 py-2 border-t border-[var(--border-muted)]">
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleToday}
                  className="text-xs text-[var(--primary)] hover:underline transition-colors"
                >
                  Today
                </button>
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}

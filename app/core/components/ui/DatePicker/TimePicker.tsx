/**
 * TimePicker Component
 * Simple hour/minute selector using Select dropdowns
 */

import { useMemo } from 'react';
import { Select } from '../Select';

export interface TimePickerProps {
  /** Current hours value (0-23) */
  hours: number;
  /** Current minutes value (0-59) */
  minutes: number;
  /** Callback when time changes */
  onChange: (hours: number, minutes: number) => void;
  /** Whether the picker is disabled */
  disabled?: boolean;
}

export function TimePicker({
  hours,
  minutes,
  onChange,
  disabled = false,
}: TimePickerProps) {
  // Generate hour options (0-23)
  const hourOptions = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      value: String(i),
      label: String(i).padStart(2, '0'),
    }));
  }, []);

  // Generate minute options (0-59 in 5-minute increments)
  const minuteOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const value = i * 5;
      return {
        value: String(value),
        label: String(value).padStart(2, '0'),
      };
    });
  }, []);

  const handleHoursChange = (value: string) => {
    onChange(parseInt(value, 10), minutes);
  };

  const handleMinutesChange = (value: string) => {
    onChange(hours, parseInt(value, 10));
  };

  return (
    <div className="flex items-center gap-1 px-2 py-2 border-t border-[var(--border-muted)]">
      <span className="text-xs text-[var(--text-muted)] mr-1">Time:</span>
      <Select
        value={String(hours)}
        onChange={handleHoursChange}
        options={hourOptions}
        disabled={disabled}
        size="small"
        className="w-16"
      />
      <span className="text-xs text-[var(--text-muted)]">:</span>
      <Select
        value={String(Math.floor(minutes / 5) * 5)}
        onChange={handleMinutesChange}
        options={minuteOptions}
        disabled={disabled}
        size="small"
        className="w-16"
      />
    </div>
  );
}

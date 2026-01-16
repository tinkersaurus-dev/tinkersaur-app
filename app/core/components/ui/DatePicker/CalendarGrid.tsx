/**
 * CalendarGrid Component
 * Displays a month calendar view with date selection
 */

import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  format,
  addMonths,
  subMonths,
  isBefore,
  isAfter,
  startOfDay,
} from 'date-fns';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

export interface CalendarGridProps {
  /** The month to display */
  currentMonth: Date;
  /** Currently selected date */
  selectedDate: Date | null;
  /** Callback when a date is selected */
  onSelectDate: (date: Date) => void;
  /** Callback when navigating to a different month */
  onMonthChange: (date: Date) => void;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function CalendarGrid({
  currentMonth,
  selectedDate,
  onSelectDate,
  onMonthChange,
  minDate,
  maxDate,
}: CalendarGridProps) {
  // Generate all days to display (including days from adjacent months to fill the grid)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const handlePrevMonth = () => {
    onMonthChange(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };

  const isDateDisabled = (date: Date): boolean => {
    const day = startOfDay(date);
    if (minDate && isBefore(day, startOfDay(minDate))) return true;
    if (maxDate && isAfter(day, startOfDay(maxDate))) return true;
    return false;
  };

  const handleDateClick = (date: Date) => {
    if (!isDateDisabled(date)) {
      onSelectDate(date);
    }
  };

  return (
    <div className="p-2">
      {/* Header with month/year and navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 rounded hover:bg-[var(--bg-dark)] transition-colors"
          aria-label="Previous month"
        >
          <LuChevronLeft className="w-4 h-4 text-[var(--text-muted)]" />
        </button>
        <span className="text-sm font-medium text-[var(--text)]">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 rounded hover:bg-[var(--bg-dark)] transition-colors"
          aria-label="Next month"
        >
          <LuChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map((day) => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-xs font-medium text-[var(--text-muted)]"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((date) => {
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isTodayDate = isToday(date);
          const isDisabled = isDateDisabled(date);

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => handleDateClick(date)}
              disabled={isDisabled}
              className={`
                h-8 w-8 flex items-center justify-center text-xs rounded
                transition-colors
                ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--bg-dark)]'}
                ${!isCurrentMonth ? 'text-[var(--text-muted)]' : 'text-[var(--text)]'}
                ${isSelected ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary)]' : ''}
                ${isTodayDate && !isSelected ? 'ring-1 ring-[var(--primary)] ring-inset' : ''}
              `}
              aria-label={format(date, 'MMMM d, yyyy')}
              aria-selected={isSelected || undefined}
              aria-disabled={isDisabled}
            >
              {format(date, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

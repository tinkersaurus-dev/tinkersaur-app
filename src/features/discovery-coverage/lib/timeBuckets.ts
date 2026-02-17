import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  addDays,
  addWeeks,
  addMonths,
  format,
  endOfWeek,
} from 'date-fns';
import type { Feedback } from '@/entities/feedback';
import type { TimeGranularity } from '@/features/feedback-analysis';

export function getBucketStart(date: Date, granularity: TimeGranularity): Date {
  switch (granularity) {
    case 'day':
      return startOfDay(date);
    case 'week':
      return startOfWeek(date, { weekStartsOn: 1 });
    case 'month':
      return startOfMonth(date);
  }
}

export function addInterval(date: Date, granularity: TimeGranularity): Date {
  switch (granularity) {
    case 'day':
      return addDays(date, 1);
    case 'week':
      return addWeeks(date, 1);
    case 'month':
      return addMonths(date, 1);
  }
}

export function formatBucketLabel(
  date: Date,
  granularity: TimeGranularity,
): string {
  switch (granularity) {
    case 'day':
      return format(date, 'MMM d');
    case 'week': {
      const end = endOfWeek(date, { weekStartsOn: 1 });
      return `${format(date, 'MMM d')}–${format(end, 'd')}`;
    }
    case 'month':
      return format(date, 'MMM yyyy');
  }
}

export function resolveFeedbackDate(
  item: Feedback,
  intakeSourceDateMap?: Record<string, string>,
): Date {
  if (intakeSourceDateMap && item.intakeSourceId) {
    const sourceDate = intakeSourceDateMap[item.intakeSourceId];
    if (sourceDate) {
      return new Date(sourceDate);
    }
  }
  return new Date(item.createdAt);
}

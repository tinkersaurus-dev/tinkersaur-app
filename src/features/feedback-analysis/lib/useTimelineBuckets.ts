import { useMemo } from 'react';
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
import { ALL_FEEDBACK_TYPES, resolveFeedbackDate } from '@/entities/feedback';
import type { TimeGranularity } from './useAnalyzeFilterState';

export interface TimelineBucket {
  key: string;
  label: string;
  startDate: Date;
  suggestion: number;
  problem: number;
  concern: number;
  praise: number;
  question: number;
  insight: number;
  workaround: number;
  context: number;
  total: number;
}

function getBucketStart(date: Date, granularity: TimeGranularity): Date {
  switch (granularity) {
    case 'day':
      return startOfDay(date);
    case 'week':
      return startOfWeek(date, { weekStartsOn: 1 });
    case 'month':
      return startOfMonth(date);
  }
}

function addInterval(date: Date, granularity: TimeGranularity): Date {
  switch (granularity) {
    case 'day':
      return addDays(date, 1);
    case 'week':
      return addWeeks(date, 1);
    case 'month':
      return addMonths(date, 1);
  }
}

function formatBucketLabel(date: Date, granularity: TimeGranularity): string {
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

function createEmptyBucket(startDate: Date, granularity: TimeGranularity): TimelineBucket {
  return {
    key: startDate.toISOString(),
    label: formatBucketLabel(startDate, granularity),
    startDate,
    suggestion: 0,
    problem: 0,
    concern: 0,
    praise: 0,
    question: 0,
    insight: 0,
    workaround: 0,
    context: 0,
    total: 0,
  };
}

export function useTimelineBuckets(
  feedback: Feedback[],
  granularity: TimeGranularity,
  intakeSourceDateMap?: Record<string, string>,
): TimelineBucket[] {
  return useMemo(() => {
    if (feedback.length === 0) return [];

    // Find date range using resolved dates
    const dates = feedback.map((f) =>
      resolveFeedbackDate(f, intakeSourceDateMap).getTime(),
    );
    const minDate = new Date(Math.min(...dates));

    // Range always ends at today, starts at least 30 days before today
    const today = startOfDay(new Date());
    const MIN_DAYS = 30;
    const thirtyDaysAgo = addDays(today, -MIN_DAYS);
    const expandedMin = minDate < thirtyDaysAgo ? minDate : thirtyDaysAgo;

    const rangeStart = getBucketStart(expandedMin, granularity);
    const rangeEnd = getBucketStart(today, granularity);

    // Build empty buckets for entire range
    const bucketMap = new Map<string, TimelineBucket>();
    let current = rangeStart;
    while (current <= rangeEnd) {
      const key = current.toISOString();
      bucketMap.set(key, createEmptyBucket(current, granularity));
      current = addInterval(current, granularity);
    }

    // Fill buckets with feedback counts
    for (const item of feedback) {
      const resolvedDate = resolveFeedbackDate(item, intakeSourceDateMap);
      const bucketStart = getBucketStart(resolvedDate, granularity);
      const key = bucketStart.toISOString();
      const bucket = bucketMap.get(key);
      if (bucket) {
        bucket[item.type] += 1;
        bucket.total += 1;
      }
    }

    return Array.from(bucketMap.values());
  }, [feedback, granularity, intakeSourceDateMap]);
}

/** @deprecated Import ALL_FEEDBACK_TYPES from '@/entities/feedback' instead */
export { ALL_FEEDBACK_TYPES as FEEDBACK_TYPES };

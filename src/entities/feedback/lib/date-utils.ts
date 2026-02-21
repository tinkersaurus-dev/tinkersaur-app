import type { Feedback } from '../model/types';

/**
 * Resolve the date to use for a feedback item.
 * Prefers intake source date when available, falls back to createdAt.
 */
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

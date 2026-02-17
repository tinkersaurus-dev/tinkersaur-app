import type { Feedback } from '../model/types';

export function isUnlinkedFeedback(f: Feedback): boolean {
  return f.personaIds.length === 0;
}

export function filterUnlinkedFeedback(feedbacks: Feedback[]): Feedback[] {
  return feedbacks.filter(isUnlinkedFeedback);
}

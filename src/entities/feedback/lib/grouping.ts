import type { Feedback } from '../model/types';

export interface FeedbackGrouping {
  parents: Feedback[];
  unparented: Feedback[];
  childrenByParentId: Map<string, Feedback[]>;
}

/**
 * Separate feedback into parents (items with children), unparented (standalone items),
 * and a map of children keyed by parent ID.
 */
export function groupFeedbackByParent(feedback: Feedback[]): FeedbackGrouping {
  const childrenByParentId = new Map<string, Feedback[]>();
  const parents: Feedback[] = [];
  const unparented: Feedback[] = [];

  for (const fb of feedback) {
    if (fb.parentFeedbackId) {
      const children = childrenByParentId.get(fb.parentFeedbackId) ?? [];
      children.push(fb);
      childrenByParentId.set(fb.parentFeedbackId, children);
    }
  }

  for (const fb of feedback) {
    if (fb.parentFeedbackId) continue;
    if (childrenByParentId.has(fb.id)) {
      parents.push(fb);
    } else {
      unparented.push(fb);
    }
  }

  return { parents, unparented, childrenByParentId };
}

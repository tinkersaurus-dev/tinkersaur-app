import type { UserGoal } from '../model/types';

interface FeedbackLike {
  type: string;
  intakeSourceId: string | null;
}

export interface FeedbackTypeCounts {
  problemCount: number;
  suggestionCount: number;
  otherCount: number;
  sourceCount: number;
}

/**
 * Count feedback items linked to a user goal, broken down by type.
 * Also counts unique intake sources for breadth measurement.
 */
export function countFeedbackByType(
  userGoal: UserGoal,
  feedbackById: Map<string, FeedbackLike>,
): FeedbackTypeCounts {
  const feedbackIds = userGoal.feedbackIds ?? [];
  let problemCount = 0;
  let suggestionCount = 0;
  let otherCount = 0;
  const sourceIds = new Set<string>();

  for (const fId of feedbackIds) {
    const f = feedbackById.get(fId);
    if (!f) continue;
    if (f.type === 'problem') problemCount++;
    else if (f.type === 'suggestion') suggestionCount++;
    else otherCount++;
    if (f.intakeSourceId) sourceIds.add(f.intakeSourceId);
  }

  return { problemCount, suggestionCount, otherCount, sourceCount: sourceIds.size };
}

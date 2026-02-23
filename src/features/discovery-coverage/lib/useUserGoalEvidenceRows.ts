import { useMemo } from 'react';
import type { UserGoal } from '@/entities/user-goal';
import { getEvidenceCount, hasWeakEvidence, countFeedbackByType } from '@/entities/user-goal';
import type { Feedback } from '@/entities/feedback';

export interface UserGoalEvidenceRow {
  id: string;
  name: string;
  personaCount: number;
  problemCount: number;
  suggestionCount: number;
  otherFeedbackCount: number;
  sourceCount: number;
  evidenceScore: number;
  isWeak: boolean;
}

export function useUserGoalEvidenceRows(
  userGoals: UserGoal[],
  allFeedback: Feedback[],
): UserGoalEvidenceRow[] {
  return useMemo(() => {
    const feedbackById = new Map<string, Feedback>();
    for (const f of allFeedback) {
      feedbackById.set(f.id, f);
    }

    return userGoals
      .map((ug) => {
        const counts = countFeedbackByType(ug, feedbackById);

        return {
          id: ug.id,
          name: ug.name,
          personaCount: ug.personaIds?.length ?? 0,
          problemCount: counts.problemCount,
          suggestionCount: counts.suggestionCount,
          otherFeedbackCount: counts.otherCount,
          sourceCount: counts.sourceCount,
          evidenceScore: getEvidenceCount(ug),
          isWeak: hasWeakEvidence(ug),
        };
      })
      .sort((a, b) => a.evidenceScore - b.evidenceScore)
      .slice(0, 10);
  }, [userGoals, allFeedback]);
}

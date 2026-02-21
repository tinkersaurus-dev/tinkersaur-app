import { useMemo } from 'react';
import type { UseCase } from '@/entities/use-case';
import { getEvidenceCount, hasWeakEvidence, countFeedbackByType } from '@/entities/use-case';
import type { Feedback } from '@/entities/feedback';

export interface UseCaseEvidenceRow {
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

export function useUseCaseEvidenceRows(
  useCases: UseCase[],
  allFeedback: Feedback[],
): UseCaseEvidenceRow[] {
  return useMemo(() => {
    const feedbackById = new Map<string, Feedback>();
    for (const f of allFeedback) {
      feedbackById.set(f.id, f);
    }

    return useCases
      .map((uc) => {
        const counts = countFeedbackByType(uc, feedbackById);

        return {
          id: uc.id,
          name: uc.name,
          personaCount: uc.personaIds?.length ?? 0,
          problemCount: counts.problemCount,
          suggestionCount: counts.suggestionCount,
          otherFeedbackCount: counts.otherCount,
          sourceCount: counts.sourceCount,
          evidenceScore: getEvidenceCount(uc),
          isWeak: hasWeakEvidence(uc),
        };
      })
      .sort((a, b) => a.evidenceScore - b.evidenceScore)
      .slice(0, 10);
  }, [useCases, allFeedback]);
}

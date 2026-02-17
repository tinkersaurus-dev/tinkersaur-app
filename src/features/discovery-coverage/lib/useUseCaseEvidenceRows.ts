import { useMemo } from 'react';
import type { UseCase } from '@/entities/use-case';
import { getEvidenceCount, hasWeakEvidence } from '@/entities/use-case';
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
    // Build a lookup from feedbackId to Feedback for fast joining
    const feedbackById = new Map<string, Feedback>();
    for (const f of allFeedback) {
      feedbackById.set(f.id, f);
    }

    return useCases
      .map((uc) => {
        const feedbackIds = uc.feedbackIds ?? [];
        let problemCount = 0;
        let suggestionCount = 0;
        let otherFeedbackCount = 0;
        const sourceIds = new Set<string>();

        for (const fId of feedbackIds) {
          const f = feedbackById.get(fId);
          if (!f) continue;
          if (f.type === 'problem') problemCount++;
          else if (f.type === 'suggestion') suggestionCount++;
          else otherFeedbackCount++;
          if (f.intakeSourceId) sourceIds.add(f.intakeSourceId);
        }

        return {
          id: uc.id,
          name: uc.name,
          personaCount: uc.personaIds?.length ?? 0,
          problemCount,
          suggestionCount,
          otherFeedbackCount,
          sourceCount: sourceIds.size,
          evidenceScore: getEvidenceCount(uc),
          isWeak: hasWeakEvidence(uc),
        };
      })
      .sort((a, b) => a.evidenceScore - b.evidenceScore)
      .slice(0, 10);
  }, [useCases, allFeedback]);
}

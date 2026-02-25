import { useEffect, useCallback, useRef } from 'react';
import { useIntakeStore } from '../model/useIntakeStore';
import { useAuthStore } from '@/shared/auth';
import { feedbackApi } from '@/entities/feedback';
import { userGoalApi } from '@/entities/user-goal';
import { outcomeApi } from '@/entities/outcome';
import type { SimilarFeedbackResult } from '@/entities/feedback';
import type { SimilarUserGoalResult } from '@/entities/user-goal';
import type { SimilarOutcomeResult } from '@/entities/outcome';
import type { Extraction, FeedbackEntity, UserGoalEntity, OutcomeEntity } from '../model/types';

const INLINE_SIMILARITY_TYPES = new Set(['feedback', 'userGoals', 'outcomes']);

/**
 * Hook that watches for extraction completion and automatically
 * checks for similar existing entities (feedback, use cases, outcomes).
 * Mirrors the pattern of usePersonaSimilarityCheck but for inline card types.
 */
export function useInlineSimilarityCheck() {
  const teamId = useAuthStore((state) => state.selectedTeam?.teamId);
  const phase = useIntakeStore((state) => state.phase);
  const extractions = useIntakeStore((state) => state.extractions);
  const inlineSimilarityMatches = useIntakeStore((state) => state.inlineSimilarityMatches);
  const checkingInlineSimilarity = useIntakeStore((state) => state.checkingInlineSimilarity);
  const setInlineSimilarityMatch = useIntakeStore((state) => state.setInlineSimilarityMatch);
  const setCheckingInlineSimilarity = useIntakeStore((state) => state.setCheckingInlineSimilarity);

  // Track which extractions we've already started checking to avoid duplicate calls
  const checkedRef = useRef<Set<string>>(new Set());

  const checkSimilarity = useCallback(
    async (extraction: Extraction) => {
      if (!teamId) return;

      setCheckingInlineSimilarity(extraction.id, true);

      try {
        let topResult: { entityId: string; similarity: number; result: unknown } | null = null;

        switch (extraction.type) {
          case 'feedback': {
            const entity = extraction.entity as FeedbackEntity;
            const results = await feedbackApi.findSimilar({
              teamId,
              content: entity.content,
              threshold: 0.5,
              limit: 1,
            });
            if (results.length > 0) {
              const r = results[0] as SimilarFeedbackResult;
              topResult = { entityId: r.feedback.id, similarity: r.similarity, result: r };
            }
            break;
          }
          case 'userGoals': {
            const entity = extraction.entity as UserGoalEntity;
            const results = await userGoalApi.findSimilar({
              teamId,
              name: entity.name,
              description: entity.description,
              threshold: 0.5,
              limit: 1,
            });
            if (results.length > 0) {
              const r = results[0] as SimilarUserGoalResult;
              topResult = { entityId: r.userGoal.id, similarity: r.similarity, result: r };
            }
            break;
          }
          case 'outcomes': {
            const entity = extraction.entity as OutcomeEntity;
            const results = await outcomeApi.findSimilar({
              teamId,
              description: entity.description,
              target: entity.target,
              threshold: 0.5,
              limit: 1,
            });
            if (results.length > 0) {
              const r = results[0] as SimilarOutcomeResult;
              topResult = { entityId: r.outcome.id, similarity: r.similarity, result: r };
            }
            break;
          }
        }

        if (topResult) {
          setInlineSimilarityMatch(extraction.id, {
            extractionId: extraction.id,
            entityId: topResult.entityId,
            entityType: extraction.type,
            similarity: topResult.similarity,
            result: topResult.result,
          });
        } else {
          // No match — store null to indicate "checked, no results"
          setInlineSimilarityMatch(extraction.id, null);
        }
      } catch (error) {
        console.error(`Failed to check ${extraction.type} similarity:`, error);
        // Set null so we don't retry
        setInlineSimilarityMatch(extraction.id, null);
      } finally {
        setCheckingInlineSimilarity(extraction.id, false);
      }
    },
    [teamId, setInlineSimilarityMatch, setCheckingInlineSimilarity]
  );

  // Watch for extractions and check similarity when phase is complete
  useEffect(() => {
    if (phase !== 'complete') return;

    for (const extraction of extractions.values()) {
      // Only check inline types (not personas, not requirements)
      if (!INLINE_SIMILARITY_TYPES.has(extraction.type)) continue;

      // Skip if already checked, currently checking, or we've started a check
      if (
        inlineSimilarityMatches.has(extraction.id) ||
        checkingInlineSimilarity.has(extraction.id) ||
        checkedRef.current.has(extraction.id)
      ) {
        continue;
      }

      // Mark as started to prevent duplicate calls
      checkedRef.current.add(extraction.id);
      checkSimilarity(extraction);
    }
  }, [phase, extractions, inlineSimilarityMatches, checkingInlineSimilarity, checkSimilarity]);

  // Clean up ref when extractions are removed
  useEffect(() => {
    const currentIds = new Set(
      Array.from(extractions.values())
        .filter((e) => INLINE_SIMILARITY_TYPES.has(e.type))
        .map((e) => e.id)
    );
    for (const id of checkedRef.current) {
      if (!currentIds.has(id)) {
        checkedRef.current.delete(id);
      }
    }
  }, [extractions]);
}

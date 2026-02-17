import { useMemo } from 'react';
import type { Feedback } from '@/entities/feedback';
import type { Tag } from '@/entities/tag';
import type { TagSignal } from './types';

/**
 * Computes signal strength for each tag based on feedback data.
 *
 * Formula: signalStrength = (1 + feedbackCount) × uniquePersonaCount × log₂(1 + uniqueSourceCount)
 *
 * Returns tags sorted by signal strength descending, with normalized scores (0–100).
 */
export function useSignalStrengthData(
  allFeedback: Feedback[],
  tags: Tag[],
): TagSignal[] {
  return useMemo(() => {
    if (tags.length === 0) return [];

    // Build per-tag aggregation: feedbackIds, personaIds, sourceIds
    const tagAgg = new Map<string, {
      feedbackCount: number;
      personaIds: Set<string>;
      sourceIds: Set<string>;
    }>();

    // Initialize for each known tag
    for (const tag of tags) {
      tagAgg.set(tag.name, {
        feedbackCount: 0,
        personaIds: new Set(),
        sourceIds: new Set(),
      });
    }

    // Single pass through all feedback
    for (const fb of allFeedback) {
      for (const tagName of fb.tags) {
        const agg = tagAgg.get(tagName);
        if (!agg) continue;

        agg.feedbackCount += 1;

        for (const personaId of fb.personaIds) {
          agg.personaIds.add(personaId);
        }

        if (fb.intakeSourceId) {
          agg.sourceIds.add(fb.intakeSourceId);
        }
      }
    }

    // Compute signal strength for each tag
    const signals: TagSignal[] = [];

    for (const [tagName, agg] of tagAgg) {
      const uniquePersonaCount = agg.personaIds.size;
      const uniqueSourceCount = agg.sourceIds.size;

      const signalStrength =
        (1 + agg.feedbackCount) *
        uniquePersonaCount *
        Math.log2(1 + uniqueSourceCount);

      signals.push({
        tagName,
        signalStrength,
        normalizedStrength: 0, // filled below
        feedbackCount: agg.feedbackCount,
        uniquePersonaCount,
        uniqueSourceCount,
      });
    }

    // Sort descending by signal strength
    signals.sort((a, b) => b.signalStrength - a.signalStrength);

    // Normalize to 0–100 relative to max
    const maxStrength = signals.length > 0 ? signals[0].signalStrength : 1;
    if (maxStrength > 0) {
      for (const s of signals) {
        s.normalizedStrength = Math.round((s.signalStrength / maxStrength) * 100);
      }
    }

    return signals;
  }, [allFeedback, tags]);
}

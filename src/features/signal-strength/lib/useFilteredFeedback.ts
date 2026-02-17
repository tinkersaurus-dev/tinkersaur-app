import { useMemo } from 'react';
import type { Feedback, FeedbackType } from '@/entities/feedback';
import type { Persona } from '@/entities/persona';
import type { UseCase } from '@/entities/use-case';
import type { PainRadarRow } from './types';
import { PAIN_TYPES, OPPORTUNITY_TYPES } from './types';

const ALL_TYPES: FeedbackType[] = [
  'suggestion', 'problem', 'concern', 'praise',
  'question', 'insight', 'workaround', 'context',
];

function emptyTypeCounts(): Record<FeedbackType, number> {
  return Object.fromEntries(ALL_TYPES.map((t) => [t, 0])) as Record<FeedbackType, number>;
}

interface FilteredFeedbackResult {
  /** Parent + unparented feedback for the right-column list */
  filteredParents: Feedback[];
  /** Radar data for personas */
  personaRadarData: PainRadarRow[];
  /** Radar data for use cases */
  useCaseRadarData: PainRadarRow[];
  /** Max count across all radar rows (for normalizing bar widths) */
  maxRadarCount: number;
}

/**
 * Computes filtered feedback and Pain Radar data based on selected tag.
 *
 * When no tag is selected, all feedback is included.
 * When a tag is selected:
 *   - filteredParents: parent feedback where at least one child has the tag,
 *     plus unparented feedback with the tag
 *   - Radar counts: only feedback items that themselves have the tag
 */
export function useFilteredFeedback(
  allFeedback: Feedback[],
  personas: Persona[],
  useCases: UseCase[],
  selectedTag: string | null,
): FilteredFeedbackResult {
  return useMemo(() => {
    // Build lookup maps
    const personaMap = new Map(personas.map((p) => [p.id, p]));
    const useCaseMap = new Map(useCases.map((uc) => [uc.id, uc]));

    // Separate feedback into parents, children, and unparented
    const childrenByParent = new Map<string, Feedback[]>();
    const parentFeedback: Feedback[] = [];
    const unparentedFeedback: Feedback[] = [];

    for (const fb of allFeedback) {
      if (fb.parentFeedbackId) {
        const children = childrenByParent.get(fb.parentFeedbackId) ?? [];
        children.push(fb);
        childrenByParent.set(fb.parentFeedbackId, children);
      }
    }

    for (const fb of allFeedback) {
      if (fb.parentFeedbackId) continue; // skip children
      if (childrenByParent.has(fb.id)) {
        parentFeedback.push(fb);
      } else {
        unparentedFeedback.push(fb);
      }
    }

    // Determine which feedback to include
    let filteredParents: Feedback[];
    let radarFeedback: Feedback[]; // feedback items that count toward radar

    if (!selectedTag) {
      // No filter — show all parent + unparented
      filteredParents = [...parentFeedback, ...unparentedFeedback];
      radarFeedback = allFeedback;
    } else {
      const hasTag = (fb: Feedback) => fb.tags.includes(selectedTag);

      // Parents where at least one child has the tag, or parent itself has the tag
      const matchingParents = parentFeedback.filter((parent) => {
        if (hasTag(parent)) return true;
        const children = childrenByParent.get(parent.id) ?? [];
        return children.some(hasTag);
      });

      // Unparented feedback with the tag
      const matchingUnparented = unparentedFeedback.filter(hasTag);

      filteredParents = [...matchingParents, ...matchingUnparented];

      // Radar counts: only feedback items that themselves have the tag
      radarFeedback = allFeedback.filter(hasTag);
    }

    // Build persona radar data
    const personaCounts = new Map<string, Record<FeedbackType, number>>();

    for (const fb of radarFeedback) {
      for (const personaId of fb.personaIds) {
        if (!personaCounts.has(personaId)) {
          personaCounts.set(personaId, emptyTypeCounts());
        }
        personaCounts.get(personaId)![fb.type] += 1;
      }
    }

    const personaRadarData: PainRadarRow[] = [];
    for (const [personaId, typeCounts] of personaCounts) {
      const persona = personaMap.get(personaId);
      if (!persona) continue;

      const painTotal = PAIN_TYPES.reduce((sum, t) => sum + typeCounts[t], 0);
      const opportunityTotal = OPPORTUNITY_TYPES.reduce((sum, t) => sum + typeCounts[t], 0);

      personaRadarData.push({
        id: personaId,
        name: persona.name,
        subtitle: persona.role,
        typeCounts,
        painTotal,
        opportunityTotal,
      });
    }

    // Sort by total feedback count descending
    personaRadarData.sort(
      (a, b) => (b.painTotal + b.opportunityTotal) - (a.painTotal + a.opportunityTotal),
    );

    // Build use case radar data
    const useCaseCounts = new Map<string, Record<FeedbackType, number>>();

    for (const fb of radarFeedback) {
      for (const useCaseId of fb.useCaseIds) {
        if (!useCaseCounts.has(useCaseId)) {
          useCaseCounts.set(useCaseId, emptyTypeCounts());
        }
        useCaseCounts.get(useCaseId)![fb.type] += 1;
      }
    }

    const useCaseRadarData: PainRadarRow[] = [];
    for (const [useCaseId, typeCounts] of useCaseCounts) {
      const useCase = useCaseMap.get(useCaseId);
      if (!useCase) continue;

      const painTotal = PAIN_TYPES.reduce((sum, t) => sum + typeCounts[t], 0);
      const opportunityTotal = OPPORTUNITY_TYPES.reduce((sum, t) => sum + typeCounts[t], 0);

      useCaseRadarData.push({
        id: useCaseId,
        name: useCase.name,
        typeCounts,
        painTotal,
        opportunityTotal,
      });
    }

    useCaseRadarData.sort(
      (a, b) => (b.painTotal + b.opportunityTotal) - (a.painTotal + a.opportunityTotal),
    );

    // Compute max count across all rows (for normalizing bar widths)
    let maxRadarCount = 1;
    for (const row of [...personaRadarData, ...useCaseRadarData]) {
      maxRadarCount = Math.max(maxRadarCount, row.painTotal, row.opportunityTotal);
    }

    return {
      filteredParents,
      personaRadarData,
      useCaseRadarData,
      maxRadarCount,
    };
  }, [allFeedback, personas, useCases, selectedTag]);
}

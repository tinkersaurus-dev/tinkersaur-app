import { useMemo } from 'react';
import type { Feedback, FeedbackType } from '@/entities/feedback';
import { emptyTypeCounts, getPainTotal, getOpportunityTotal, groupFeedbackByParent } from '@/entities/feedback';
import type { Persona } from '@/entities/persona';
import type { UserGoal } from '@/entities/user-goal';
import type { PainRadarRow } from './types';

interface FilteredFeedbackResult {
  /** Parent + unparented feedback for the right-column list */
  filteredParents: Feedback[];
  /** Radar data for personas */
  personaRadarData: PainRadarRow[];
  /** Radar data for user goals */
  userGoalRadarData: PainRadarRow[];
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
  userGoals: UserGoal[],
  selectedTag: string | null,
): FilteredFeedbackResult {
  return useMemo(() => {
    // Build lookup maps
    const personaMap = new Map(personas.map((p) => [p.id, p]));
    const userGoalMap = new Map(userGoals.map((ug) => [ug.id, ug]));

    const { parents: parentFeedback, unparented: unparentedFeedback, childrenByParentId } = groupFeedbackByParent(allFeedback);

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
        const children = childrenByParentId.get(parent.id) ?? [];
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

      const painTotal = getPainTotal(typeCounts);
      const opportunityTotal = getOpportunityTotal(typeCounts);

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

    // Build user goal radar data
    const userGoalCounts = new Map<string, Record<FeedbackType, number>>();

    for (const fb of radarFeedback) {
      for (const userGoalId of fb.userGoalIds) {
        if (!userGoalCounts.has(userGoalId)) {
          userGoalCounts.set(userGoalId, emptyTypeCounts());
        }
        userGoalCounts.get(userGoalId)![fb.type] += 1;
      }
    }

    const userGoalRadarData: PainRadarRow[] = [];
    for (const [userGoalId, typeCounts] of userGoalCounts) {
      const userGoal = userGoalMap.get(userGoalId);
      if (!userGoal) continue;

      const painTotal = getPainTotal(typeCounts);
      const opportunityTotal = getOpportunityTotal(typeCounts);

      userGoalRadarData.push({
        id: userGoalId,
        name: userGoal.name,
        typeCounts,
        painTotal,
        opportunityTotal,
      });
    }

    userGoalRadarData.sort(
      (a, b) => (b.painTotal + b.opportunityTotal) - (a.painTotal + a.opportunityTotal),
    );

    // Compute max count across all rows (for normalizing bar widths)
    let maxRadarCount = 1;
    for (const row of [...personaRadarData, ...userGoalRadarData]) {
      maxRadarCount = Math.max(maxRadarCount, row.painTotal, row.opportunityTotal);
    }

    return {
      filteredParents,
      personaRadarData,
      userGoalRadarData,
      maxRadarCount,
    };
  }, [allFeedback, personas, userGoals, selectedTag]);
}

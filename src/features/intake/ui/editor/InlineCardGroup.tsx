import { useState, useCallback } from 'react';
import { useIntakeStore } from '../../model/useIntakeStore';
import { ExtractionCard } from '../cards/ExtractionCard';
import { SimilarityConnector } from '../cards/SimilarityConnector';
import { SimilarEntityCard } from '../cards/SimilarEntityCard';
import { IntakeUserGoalMergeModal } from '../merge/IntakeUserGoalMergeModal';
import type {
  Extraction,
  InlineSimilarityMatch,
  UserGoalEntity,
  PendingUserGoalMerge,
} from '../../model/types';
import type { SimilarFeedbackResult } from '@/entities/feedback';
import type { SimilarOutcomeResult } from '@/entities/outcome';

interface InlineCardGroupProps {
  extractionIds: string[];
  extractions: Map<string, Extraction>;
}

/**
 * Renders one or more extraction cards inline after a paragraph.
 * Cards with similar matches display horizontally: [extraction] → [similar entity].
 */
export function InlineCardGroup({ extractionIds, extractions }: InlineCardGroupProps) {
  const activeExtractionId = useIntakeStore((state) => state.activeExtractionId);
  const newExtractionIds = useIntakeStore((state) => state.newExtractionIds);
  const setActiveExtraction = useIntakeStore((state) => state.setActiveExtraction);
  const acceptExtraction = useIntakeStore((state) => state.acceptExtraction);
  const rejectExtraction = useIntakeStore((state) => state.rejectExtraction);
  const clearNewExtractionFlag = useIntakeStore((state) => state.clearNewExtractionFlag);

  // Inline similarity state
  const inlineSimilarityMatches = useIntakeStore((state) => state.inlineSimilarityMatches);
  const checkingInlineSimilarity = useIntakeStore((state) => state.checkingInlineSimilarity);
  const dismissedSimilarities = useIntakeStore((state) => state.dismissedSimilarities);
  const dismissSimilarity = useIntakeStore((state) => state.dismissSimilarity);

  // Pending merge state
  const pendingFeedbackMerges = useIntakeStore((state) => state.pendingFeedbackMerges);
  const pendingUserGoalMerges = useIntakeStore((state) => state.pendingUserGoalMerges);
  const pendingOutcomeMerges = useIntakeStore((state) => state.pendingOutcomeMerges);
  const addPendingFeedbackMerge = useIntakeStore((state) => state.addPendingFeedbackMerge);
  const addPendingUserGoalMerge = useIntakeStore((state) => state.addPendingUserGoalMerge);
  const addPendingOutcomeMerge = useIntakeStore((state) => state.addPendingOutcomeMerge);
  const removePendingFeedbackMerge = useIntakeStore((state) => state.removePendingFeedbackMerge);
  const removePendingUserGoalMerge = useIntakeStore((state) => state.removePendingUserGoalMerge);
  const removePendingOutcomeMerge = useIntakeStore((state) => state.removePendingOutcomeMerge);

  // User goal merge modal state
  const [ugMergeModalExtraction, setUgMergeModalExtraction] = useState<{
    id: string;
    extraction: Extraction;
    match: InlineSimilarityMatch;
  } | null>(null);

  const getPendingMerge = (id: string, type: string) => {
    switch (type) {
      case 'feedback': return pendingFeedbackMerges.get(id);
      case 'userGoals': return pendingUserGoalMerges.get(id);
      case 'outcomes': return pendingOutcomeMerges.get(id);
      default: return undefined;
    }
  };

  const removePendingMerge = useCallback((id: string, type: string) => {
    switch (type) {
      case 'feedback': removePendingFeedbackMerge(id); break;
      case 'userGoals': removePendingUserGoalMerge(id); break;
      case 'outcomes': removePendingOutcomeMerge(id); break;
    }
  }, [removePendingFeedbackMerge, removePendingUserGoalMerge, removePendingOutcomeMerge]);

  const handleMerge = useCallback((id: string, extraction: Extraction, match: InlineSimilarityMatch) => {
    switch (extraction.type) {
      case 'feedback': {
        const r = match.result as SimilarFeedbackResult;
        addPendingFeedbackMerge(id, {
          extractionId: id,
          parentFeedbackId: r.feedback.id,
        });
        // Auto-accept if still pending
        if (extraction.status === 'pending') acceptExtraction(id);
        break;
      }
      case 'userGoals': {
        // Open the LLM merge modal
        setUgMergeModalExtraction({ id, extraction, match });
        break;
      }
      case 'outcomes': {
        const r = match.result as SimilarOutcomeResult;
        addPendingOutcomeMerge(id, {
          extractionId: id,
          parentOutcomeId: r.outcome.id,
        });
        // Auto-accept if still pending
        if (extraction.status === 'pending') acceptExtraction(id);
        break;
      }
    }
  }, [addPendingFeedbackMerge, addPendingOutcomeMerge, acceptExtraction]);

  const handleUserGoalMergeConfirmed = useCallback((pendingMerge: PendingUserGoalMerge) => {
    if (!ugMergeModalExtraction) return;
    const { id, extraction } = ugMergeModalExtraction;
    addPendingUserGoalMerge(id, {
      extractionId: id,
      targetUserGoalId: pendingMerge.targetUserGoalId,
      sourceUserGoalIds: pendingMerge.sourceUserGoalIds,
      mergedUserGoal: pendingMerge.mergedUserGoal,
      quotes: pendingMerge.quotes,
    });
    // Auto-accept if still pending
    if (extraction.status === 'pending') acceptExtraction(id);
    setUgMergeModalExtraction(null);
  }, [ugMergeModalExtraction, addPendingUserGoalMerge, acceptExtraction]);

  return (
    <>
      <div className="inline-card-group my-4 ml-20 space-y-2">
        {extractionIds.map((id) => {
          const extraction = extractions.get(id);
          if (!extraction) return null;

          const match = inlineSimilarityMatches.get(id);
          const isDismissed = dismissedSimilarities.has(id);
          const pendingMerge = getPendingMerge(id, extraction.type);
          const isChecking = checkingInlineSimilarity.has(id);
          const showSimilar = match && !isDismissed && !pendingMerge;
          const showConnector = isChecking || showSimilar || !!pendingMerge;

          // For user goal merges, provide the merged content to the extraction card
          const ugMerge = extraction.type === 'userGoals' ? pendingUserGoalMerges.get(id) : undefined;

          return (
            <div key={id} className="flex items-start gap-3">
              {/* Extraction card */}
              <div className="flex-1 min-w-0 max-w-2xl">
                <ExtractionCard
                  extraction={extraction}
                  isActive={id === activeExtractionId}
                  isNew={newExtractionIds.has(id)}
                  isMerged={!!pendingMerge}
                  mergedContent={ugMerge ? ugMerge.mergedUserGoal : undefined}
                  onClick={() => setActiveExtraction(id)}
                  onAccept={() => acceptExtraction(id)}
                  onReject={() => {
                    removePendingMerge(id, extraction.type);
                    rejectExtraction(id);
                  }}
                  onAnimationComplete={() => clearNewExtractionFlag(id)}
                />
              </div>

              {/* Connector */}
              {showConnector && (
                <SimilarityConnector
                  isChecking={isChecking}
                  isMerged={!!pendingMerge}
                />
              )}

              {/* Similar entity card (when match found, not dismissed, not merged) */}
              {showSimilar && (
                <div className="flex-1 min-w-0 max-w-2xl">
                  <SimilarEntityCard
                    match={match}
                    onDismiss={() => dismissSimilarity(id)}
                    onMerge={() => handleMerge(id, extraction, match)}
                  />
                </div>
              )}

              {/* Merged target card (when merge is pending) */}
              {pendingMerge && match && (
                <div className="flex-1 min-w-0 max-w-2xl">
                  <SimilarEntityCard
                    match={match}
                    isMergeTarget
                    onUndo={() => removePendingMerge(id, extraction.type)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* User goal LLM merge modal */}
      {ugMergeModalExtraction && (
        <IntakeUserGoalMergeModal
          open={true}
          onClose={() => setUgMergeModalExtraction(null)}
          intakeUserGoal={{
            name: (ugMergeModalExtraction.extraction.entity as UserGoalEntity).name,
            description: (ugMergeModalExtraction.extraction.entity as UserGoalEntity).description,
            quotes: (ugMergeModalExtraction.extraction.entity as UserGoalEntity).quotes ?? [],
            linkedPersonaIndexes: [],
          }}
          intakeUserGoalIndex={0}
          existingUserGoalIds={[ugMergeModalExtraction.match.entityId]}
          onMergeConfirmed={handleUserGoalMergeConfirmed}
        />
      )}
    </>
  );
}

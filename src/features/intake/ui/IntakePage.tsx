import { useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useIntakeStore } from '../model/useIntakeStore';
import * as agentHub from '../api/agentHub';
import { useAgentLoop } from '../lib/useAgentLoop';
import { InlineDocumentWithCards } from './editor/InlineDocumentWithCards';
import { ExtractionSuggestions } from './suggestions/ExtractionSuggestions';
import { PersonaSidebar } from './sidebar';
import { Button, Spinner, HStack, PageHeader, PageContent } from '@/shared/ui';
import { useAuthStore } from '@/shared/auth';
import { useSaveIntakeResult } from '../lib/useSaveIntakeResult';
import type { ExtractedPersona, ExtractedUserGoal } from '@/entities/intake-result';
import type { ExtractedFeedback } from '@/entities/feedback';
import type { ExtractedOutcome } from '@/entities/outcome';
import type { ExtractedRequirement } from '@/entities/requirement';
import type { SourceTypeKey } from '@/entities/source-type';
import type { PersonaEntity, UserGoalEntity, FeedbackEntity, OutcomeEntity, RequirementEntity } from '../model/types';

export function IntakePage() {
  const navigate = useNavigate();
  const phase = useIntakeStore((state) => state.phase);
  const error = useIntakeStore((state) => state.error);
  const reset = useIntakeStore((state) => state.reset);
  const extractions = useIntakeStore((state) => state.extractions);
  const acceptAllExtractions = useIntakeStore((state) => state.acceptAllExtractions);
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const { saveIntakeResult, isSaving } = useSaveIntakeResult();
  const { startExtraction, detectType } = useAgentLoop();

  // Calculate extraction counts for header
  const totalExtractions = extractions.size;
  const acceptedCount = useMemo(() => {
    let count = 0;
    extractions.forEach((e) => {
      if (e.status === 'accepted') count++;
    });
    return count;
  }, [extractions]);

  const pendingCount = useMemo(() => {
    let count = 0;
    extractions.forEach((e) => {
      if (e.status === 'pending') count++;
    });
    return count;
  }, [extractions]);

  // Convert accepted extractions to the format expected by useSaveIntakeResult.
  // Reads intake store values via getState() for freshness (needed by handleAcceptAllAndSave).
  const handleSave = useCallback(async () => {
    if (!selectedTeam) {
      toast.error('No team selected. Please select a team first.');
      return;
    }

    // Read fresh state from the store to avoid stale closure issues
    const {
      extractions: currentExtractions,
      pendingPersonaMerges,
      pendingFeedbackMerges,
      pendingUserGoalMerges,
      pendingOutcomeMerges,
      documentType,
      selectedSolutionId,
      selectedSourceType,
      sourceMetadata,
    } = useIntakeStore.getState();

    // Gather accepted extractions by type
    const acceptedExtractions = Array.from(currentExtractions.values()).filter(
      (e) => e.status === 'accepted'
    );

    // Convert to ExtractedPersona format
    const personas: ExtractedPersona[] = acceptedExtractions
      .filter((e) => e.type === 'personas')
      .map((e) => {
        const entity = e.entity as PersonaEntity;
        return {
          name: entity.name,
          role: entity.role,
          description: entity.description,
          goals: entity.goals ?? [],
          painPoints: entity.painPoints ?? [],
          demographics: {},
          quotes: entity.quotes ?? [],
        };
      });

    // Build LLM-index-to-save-index maps for linking resolution.
    // The LLM assigns 0-based indexes per type in extraction order.
    // We need to remap because rejected extractions shift save-time indexes.
    const allPersonaExtractions = Array.from(currentExtractions.values()).filter((e) => e.type === 'personas');
    const allUserGoalExtractions = Array.from(currentExtractions.values()).filter((e) => e.type === 'userGoals');

    // Map from LLM persona index → save-time persona index (for ALL accepted personas)
    const llmPersonaToSaveIndex = new Map<number, number>();
    let savePersonaIdx = 0;
    // First pass: non-merged personas (these match the `personas` array positions)
    allPersonaExtractions.forEach((e, llmIdx) => {
      if (e.status === 'accepted' && !pendingPersonaMerges.has(e.id)) {
        llmPersonaToSaveIndex.set(llmIdx, savePersonaIdx++);
      }
    });
    // Second pass: merged personas (indexes after non-merged, resolved via mergedPersonaIdMap)
    allPersonaExtractions.forEach((e, llmIdx) => {
      if (e.status === 'accepted' && pendingPersonaMerges.has(e.id)) {
        llmPersonaToSaveIndex.set(llmIdx, savePersonaIdx++);
      }
    });

    // Collect IDs of merged extractions (these will be saved via merge, not normal creation)
    const mergedFeedbackIds = new Set(pendingFeedbackMerges.keys());
    const mergedUserGoalIds = new Set(pendingUserGoalMerges.keys());
    const mergedOutcomeIds = new Set(pendingOutcomeMerges.keys());

    // Map from LLM user goal index → save-time user goal index (for ALL accepted user goals)
    const llmUserGoalToSaveIndex = new Map<number, number>();
    let saveUserGoalIdx = 0;
    // First pass: non-merged user goals (these match the `userGoals` array positions)
    allUserGoalExtractions.forEach((e, llmIdx) => {
      if (e.status === 'accepted' && !mergedUserGoalIds.has(e.id)) {
        llmUserGoalToSaveIndex.set(llmIdx, saveUserGoalIdx++);
      }
    });
    // Second pass: merged user goals (indexes after non-merged, resolved via mergedUserGoalIdMap)
    allUserGoalExtractions.forEach((e, llmIdx) => {
      if (e.status === 'accepted' && mergedUserGoalIds.has(e.id)) {
        llmUserGoalToSaveIndex.set(llmIdx, saveUserGoalIdx++);
      }
    });

    const remapIndexes = (llmIndexes: number[] | undefined, mapping: Map<number, number>): number[] =>
      (llmIndexes ?? [])
        .map((llmIdx) => mapping.get(llmIdx))
        .filter((idx): idx is number => idx !== undefined);

    // Convert to ExtractedUserGoal format (exclude merged)
    const userGoals: ExtractedUserGoal[] = acceptedExtractions
      .filter((e) => e.type === 'userGoals' && !mergedUserGoalIds.has(e.id))
      .map((e) => {
        const entity = e.entity as UserGoalEntity;
        // If this extraction has a pending user goal merge, use merged content
        const ugMerge = pendingUserGoalMerges.get(e.id);
        return {
          name: ugMerge?.mergedUserGoal.name ?? entity.name,
          description: ugMerge?.mergedUserGoal.description ?? entity.description,
          quotes: entity.quotes ?? [],
          linkedPersonaIndexes: remapIndexes(entity.linkedPersonaIndexes, llmPersonaToSaveIndex),
        };
      });

    // Convert to ExtractedFeedback format (exclude merged)
    const feedback: ExtractedFeedback[] = acceptedExtractions
      .filter((e) => e.type === 'feedback' && !mergedFeedbackIds.has(e.id))
      .map((e) => {
        const entity = e.entity as FeedbackEntity;
        return {
          type: entity.type,
          content: entity.content,
          tags: entity.tags ?? [],
          quotes: entity.quotes ?? [],
          linkedPersonaIndexes: remapIndexes(entity.linkedPersonaIndexes, llmPersonaToSaveIndex),
          linkedUserGoalIndexes: remapIndexes(entity.linkedUserGoalIndexes, llmUserGoalToSaveIndex),
        };
      });

    // Convert to ExtractedOutcome format (exclude merged)
    const outcomes: ExtractedOutcome[] = acceptedExtractions
      .filter((e) => e.type === 'outcomes' && !mergedOutcomeIds.has(e.id))
      .map((e) => {
        const entity = e.entity as OutcomeEntity;
        return {
          description: entity.description,
          target: entity.target,
          quotes: entity.quotes ?? [],
          linkedPersonaIndexes: remapIndexes(entity.linkedPersonaIndexes, llmPersonaToSaveIndex),
          linkedUserGoalIndexes: remapIndexes(entity.linkedUserGoalIndexes, llmUserGoalToSaveIndex),
        };
      });

    // Convert to ExtractedRequirement format
    const requirements: ExtractedRequirement[] = acceptedExtractions
      .filter((e) => e.type === 'requirements')
      .map((e) => {
        const entity = e.entity as RequirementEntity;
        return {
          text: entity.text,
          type: entity.type,
          quotes: entity.quotes ?? [],
        };
      });

    // Build simple index maps (no deletions in this flow)
    const personaIndexMap = new Map(personas.map((_, i) => [i, i]));
    const userGoalIndexMap = new Map(userGoals.map((_, i) => [i, i]));
    const feedbackIndexMap = new Map(feedback.map((_, i) => [i, i]));
    const outcomeIndexMap = new Map(outcomes.map((_, i) => [i, i]));
    const requirementIndexMap = new Map(requirements.map((_, i) => [i, i]));

    // Convert pending persona merges from intake format
    const pendingMerges = Array.from(pendingPersonaMerges.values()).map((merge) => {
      const llmIdx = allPersonaExtractions.findIndex((e) => e.id === merge.extractionId);
      return {
        intakePersonaIndex: llmPersonaToSaveIndex.get(llmIdx)!,
        targetPersonaId: merge.targetPersonaId,
        sourcePersonaIds: [],
        mergedPersona: merge.mergedPersona,
        quotes: merge.quotes,
      };
    });

    // Convert pending user goal merges from intake format
    const convertedUserGoalMerges = Array.from(pendingUserGoalMerges.values()).map((merge) => {
      const llmIdx = allUserGoalExtractions.findIndex((e) => e.id === merge.extractionId);
      return {
        intakeUserGoalIndex: llmUserGoalToSaveIndex.get(llmIdx)!,
        targetUserGoalId: merge.targetUserGoalId,
        sourceUserGoalIds: merge.sourceUserGoalIds,
        mergedUserGoal: merge.mergedUserGoal,
        quotes: merge.quotes,
      };
    });

    // Convert pending feedback merges from intake format
    const convertedFeedbackMerges = Array.from(pendingFeedbackMerges.values()).map((merge) => {
      const extraction = currentExtractions.get(merge.extractionId);
      const entity = extraction?.entity as FeedbackEntity;
      return {
        intakeFeedbackIndex: 0, // Not used for index-based lookup in intake flow
        parentFeedbackId: merge.parentFeedbackId,
        intakeFeedback: {
          type: entity.type,
          content: entity.content,
          tags: entity.tags ?? [],
          quotes: entity.quotes ?? [],
          linkedPersonaIndexes: remapIndexes(entity.linkedPersonaIndexes, llmPersonaToSaveIndex),
          linkedUserGoalIndexes: remapIndexes(entity.linkedUserGoalIndexes, llmUserGoalToSaveIndex),
        },
      };
    });

    // Convert pending outcome merges from intake format
    const convertedOutcomeMerges = Array.from(pendingOutcomeMerges.values()).map((merge) => {
      const extraction = currentExtractions.get(merge.extractionId);
      const entity = extraction?.entity as OutcomeEntity;
      return {
        intakeOutcomeIndex: 0,
        parentOutcomeId: merge.parentOutcomeId,
        intakeOutcome: {
          description: entity.description,
          target: entity.target,
          quotes: entity.quotes ?? [],
          linkedPersonaIndexes: remapIndexes(entity.linkedPersonaIndexes, llmPersonaToSaveIndex),
          linkedUserGoalIndexes: remapIndexes(entity.linkedUserGoalIndexes, llmUserGoalToSaveIndex),
        },
      };
    });

    // Use user-selected source type, fallback to detected document type, then meeting-transcript
    const sourceType: SourceTypeKey = selectedSourceType ?? (documentType as SourceTypeKey) ?? 'meeting-transcript';

    // Build solution maps from global selection
    const feedbackSolutionIds = new Map<number, string | null>(
      feedback.map((_, i) => [i, selectedSolutionId])
    );
    const outcomeSolutionIds = new Map<number, string | null>(
      outcomes.map((_, i) => [i, selectedSolutionId])
    );

    const success = await saveIntakeResult({
      personas,
      userGoals,
      feedback,
      outcomes,
      requirements,
      personaIndexMap,
      userGoalIndexMap,
      feedbackIndexMap,
      outcomeIndexMap,
      requirementIndexMap,
      teamId: selectedTeam.teamId,
      sourceType,
      metadata: sourceMetadata,
      feedbackSolutionIds,
      outcomeSolutionIds,
      pendingMerges,
      pendingUserGoalMerges: convertedUserGoalMerges,
      pendingFeedbackMerges: convertedFeedbackMerges,
      pendingOutcomeMerges: convertedOutcomeMerges,
    });

    if (success) {
      toast.success('Intake results saved successfully');
      reset();
      navigate('/discovery/organize');
    } else {
      toast.error('Failed to save intake results. Please try again.');
    }
  }, [selectedTeam, saveIntakeResult, reset, navigate]);

  const handleAcceptAllAndSave = useCallback(async () => {
    acceptAllExtractions();
    await handleSave();
  }, [acceptAllExtractions, handleSave]);

  // Manage SignalR connection at page level - single connection for all child components
  useEffect(() => {
    agentHub.connect().catch((err) => {
      console.error('Failed to connect to agent hub:', err);
    });

    return () => {
      agentHub.disconnect();
    };
  }, []);

  return (
    <>
      <PageHeader
        title="Intake"
        actions={
          phase !== 'idle' && (
            <Button variant="default" size="small" onClick={reset}>
              Start Over
            </Button>
          )
        }
      />
      <PageContent fillHeight>
        <div className="flex flex-col h-full">
          {/* Error display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Extraction options bar */}
          <div className="py-3 px-4 mb-4 border border-[var(--border)] rounded-sm bg-[var(--bg-light)] min-h-[52px]">
            <HStack justify="between" align="center">
              <div>
                {phase === 'suggesting' ? (
                  <ExtractionSuggestions onStartExtraction={startExtraction} />
                ) : phase === 'detecting' ? (
                  <HStack gap="xs" align="center">
                    <Spinner />
                    <span className="text-sm text-[var(--text-muted)]">Analyzing document type...</span>
                  </HStack>
                ) : phase === 'extracting' || phase === 'complete' ? (
                  <div className="text-sm text-[var(--text-muted)]">
                    Extracting entities from document...
                  </div>
                ) : (
                  <div className="text-sm text-[var(--text-muted)]">
                    Paste text below to extract information from meeting transcripts, support tickets, notes, requirement documents...
                  </div>
                )}
              </div>
              {(phase === 'extracting' || phase === 'complete') && totalExtractions > 0 && (
                <div className="text-sm text-right flex-shrink-0">
                  <span className="font-semibold">Extracted Items</span>
                  <span className="text-[var(--text-muted)] ml-2">
                    {acceptedCount} of {totalExtractions} accepted
                  </span>
                </div>
              )}
            </HStack>
          </div>

          {/* Main content - editor with persona sidebar */}
          <div className="flex-1 min-h-0 flex">
            {/* Document editor - takes remaining space */}
            <div className="flex-1 overflow-auto bg-[var(--bg)] border border-[var(--border)] rounded-sm">
              <InlineDocumentWithCards className="p-4 min-h-[400px]" onDetectType={detectType} />
            </div>

            {/* Persona sidebar - fixed width, appears when personas exist */}
            <PersonaSidebar />
          </div>

          {/* Footer status */}
          {phase === 'complete' && (
            <div className="mt-4 py-3 px-4 border border-[var(--border)] rounded-sm bg-[var(--bg-light)]">
              <HStack justify="between" align="center">
                <span className="text-sm text-[var(--text-muted)]">
                  Extraction complete. Review and accept items to save.
                </span>
                <HStack gap="sm">
                  {pendingCount > 0 && (
                    <Button
                      variant="primary"
                      onClick={handleAcceptAllAndSave}
                      loading={isSaving}
                      disabled={isSaving}
                    >
                      Accept All & Save
                    </Button>
                  )}
                  <Button
                    variant={pendingCount > 0 ? 'default' : 'primary'}
                    onClick={handleSave}
                    loading={isSaving}
                    disabled={isSaving || acceptedCount === 0}
                  >
                    Save Accepted Items
                  </Button>
                </HStack>
              </HStack>
            </div>
          )}
        </div>
      </PageContent>
    </>
  );
}

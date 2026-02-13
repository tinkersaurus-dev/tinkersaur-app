import { useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAgentIntakeStore } from '../model/useAgentIntakeStore';
import * as agentHub from '../api/agentHub';
import { InlineDocumentWithCards } from './editor/InlineDocumentWithCards';
import { ExtractionSuggestions } from './suggestions/ExtractionSuggestions';
import { PersonaSidebar } from './sidebar';
import { Button, Spinner, HStack, PageHeader, PageContent } from '@/shared/ui';
import { useAuthStore } from '@/features/auth';
import { useSaveIntakeResult } from '@/features/intake-analysis';
import type { ExtractedPersona, ExtractedUseCase } from '@/entities/intake-result';
import type { ExtractedFeedback } from '@/entities/feedback';
import type { ExtractedOutcome } from '@/entities/outcome';
import type { ExtractedRequirement } from '@/entities/requirement';
import type { SourceTypeKey } from '@/entities/source-type';
import type { PersonaEntity, UseCaseEntity, FeedbackEntity, OutcomeEntity, RequirementEntity } from '../model/types';

export function AgentIntakePage() {
  const navigate = useNavigate();
  const phase = useAgentIntakeStore((state) => state.phase);
  const error = useAgentIntakeStore((state) => state.error);
  const reset = useAgentIntakeStore((state) => state.reset);
  const extractions = useAgentIntakeStore((state) => state.extractions);
  const documentType = useAgentIntakeStore((state) => state.documentType);
  const pendingPersonaMerges = useAgentIntakeStore((state) => state.pendingPersonaMerges);
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const { saveIntakeResult, isSaving } = useSaveIntakeResult();

  // Calculate extraction counts for header
  const totalExtractions = extractions.size;
  const acceptedCount = useMemo(() => {
    let count = 0;
    extractions.forEach((e) => {
      if (e.status === 'accepted') count++;
    });
    return count;
  }, [extractions]);

  // Convert accepted extractions to the format expected by useSaveIntakeResult
  const handleSave = useCallback(async () => {
    if (!selectedTeam) {
      toast.error('No team selected. Please select a team first.');
      return;
    }

    // Gather accepted extractions by type
    const acceptedExtractions = Array.from(extractions.values()).filter(
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

    // Convert to ExtractedUseCase format
    const useCases: ExtractedUseCase[] = acceptedExtractions
      .filter((e) => e.type === 'useCases')
      .map((e) => {
        const entity = e.entity as UseCaseEntity;
        return {
          name: entity.name,
          description: entity.description,
          quotes: entity.quotes ?? [],
          linkedPersonaIndexes: [],
        };
      });

    // Convert to ExtractedFeedback format
    const feedback: ExtractedFeedback[] = acceptedExtractions
      .filter((e) => e.type === 'feedback')
      .map((e) => {
        const entity = e.entity as FeedbackEntity;
        return {
          type: entity.type,
          content: entity.content,
          quotes: entity.quotes ?? [],
          linkedPersonaIndexes: [],
          linkedUseCaseIndexes: [],
        };
      });

    // Convert to ExtractedOutcome format
    const outcomes: ExtractedOutcome[] = acceptedExtractions
      .filter((e) => e.type === 'outcomes')
      .map((e) => {
        const entity = e.entity as OutcomeEntity;
        return {
          description: entity.description,
          target: entity.target,
          quotes: entity.quotes ?? [],
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
    const useCaseIndexMap = new Map(useCases.map((_, i) => [i, i]));
    const feedbackIndexMap = new Map(feedback.map((_, i) => [i, i]));
    const outcomeIndexMap = new Map(outcomes.map((_, i) => [i, i]));
    const requirementIndexMap = new Map(requirements.map((_, i) => [i, i]));

    // Convert pending persona merges from agent-intake format
    const pendingMerges = Array.from(pendingPersonaMerges.values()).map((merge) => ({
      intakePersonaIndex: acceptedExtractions
        .filter((e) => e.type === 'personas')
        .findIndex((e) => e.id === merge.extractionId),
      targetPersonaId: merge.targetPersonaId,
      sourcePersonaIds: [],
      mergedPersona: merge.mergedPersona,
      quotes: merge.quotes,
    }));

    // Use document type as source type, fallback to meeting-transcript
    const sourceType: SourceTypeKey = (documentType as SourceTypeKey) ?? 'meeting-transcript';

    const success = await saveIntakeResult({
      personas,
      useCases,
      feedback,
      outcomes,
      requirements,
      personaIndexMap,
      useCaseIndexMap,
      feedbackIndexMap,
      outcomeIndexMap,
      requirementIndexMap,
      teamId: selectedTeam.teamId,
      sourceType,
      metadata: {},
      useCaseSolutionIds: new Map(),
      feedbackSolutionIds: new Map(),
      outcomeSolutionIds: new Map(),
      pendingMerges,
      pendingUseCaseMerges: [],
      pendingFeedbackMerges: [],
    });

    if (success) {
      toast.success('Intake results saved successfully');
      reset();
      navigate('/discovery/organize');
    } else {
      toast.error('Failed to save intake results. Please try again.');
    }
  }, [
    selectedTeam,
    extractions,
    documentType,
    pendingPersonaMerges,
    saveIntakeResult,
    reset,
    navigate,
  ]);

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
                  <ExtractionSuggestions />
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
              <InlineDocumentWithCards className="p-4 min-h-[400px]" />
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
                <Button
                  variant="primary"
                  onClick={handleSave}
                  loading={isSaving}
                  disabled={isSaving || acceptedCount === 0}
                >
                  Save Accepted Items
                </Button>
              </HStack>
            </div>
          )}
        </div>
      </PageContent>
    </>
  );
}

import { useState, useCallback } from 'react';
import type { ExtractedPersona } from '@/entities/intake-result';
import type { ExtractedUseCase } from '@/entities/intake-result';
import type { ExtractedFeedback } from '@/entities/feedback';
import type { ExtractedOutcome } from '@/entities/outcome';
import type { ExtractedRequirement } from '@/entities/requirement';
import type { SourceTypeKey } from '@/entities/source-type';
import { metadataToIntakeSource, intakeSourceApi } from '@/entities/intake-source';
import { personaApi, type CreatePersonaDto, type MergedPersonaData } from '@/entities/persona';
import { useCaseApi, type CreateUseCaseDto, type MergedUseCaseData } from '@/entities/use-case';
import { feedbackApi, type CreateFeedbackDto } from '@/entities/feedback';
import { outcomeApi, type CreateOutcomeDto } from '@/entities/outcome';
import { requirementApi, type CreateRequirementDto } from '@/entities/requirement';

export interface PendingMerge {
  intakePersonaIndex: number;
  targetPersonaId: string;  // The existing persona being merged INTO
  sourcePersonaIds: string[];  // Usually empty for intake merge (no source personas)
  mergedPersona: MergedPersonaData;
  quotes?: string[];  // Quotes from intake persona to link to target
}

export interface PendingUseCaseMerge {
  intakeUseCaseIndex: number;
  targetUseCaseId: string;
  sourceUseCaseIds: string[];
  mergedUseCase: MergedUseCaseData;
  quotes?: string[];  // Quotes from intake use case to link to target
}

export interface PendingFeedbackMerge {
  intakeFeedbackIndex: number;
  parentFeedbackId: string;
  intakeFeedback: ExtractedFeedback;
}

export interface PendingOutcomeMerge {
  intakeOutcomeIndex: number;
  parentOutcomeId: string;
  intakeOutcome: ExtractedOutcome;
}

interface SaveIntakeResultParams {
  personas: ExtractedPersona[];
  useCases: ExtractedUseCase[];
  feedback: ExtractedFeedback[];
  outcomes: ExtractedOutcome[];
  requirements?: ExtractedRequirement[];
  personaIndexMap: Map<number, number>;
  useCaseIndexMap: Map<number, number>;
  feedbackIndexMap: Map<number, number>;
  outcomeIndexMap: Map<number, number>;
  requirementIndexMap?: Map<number, number>;
  teamId: string;
  sourceType: SourceTypeKey;
  metadata: Record<string, string>;
  useCaseSolutionIds: Map<number, string | null>;
  feedbackSolutionIds: Map<number, string | null>;
  outcomeSolutionIds: Map<number, string | null>;
  pendingMerges: PendingMerge[];
  pendingUseCaseMerges: PendingUseCaseMerge[];
  pendingFeedbackMerges: PendingFeedbackMerge[];
  pendingOutcomeMerges: PendingOutcomeMerge[];
}

interface UseSaveIntakeResultReturn {
  saveIntakeResult: (params: SaveIntakeResultParams) => Promise<boolean>;
  isSaving: boolean;
  error: string | null;
}

export function useSaveIntakeResult(): UseSaveIntakeResultReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveIntakeResult = useCallback(
    async ({
      personas,
      useCases,
      feedback,
      outcomes,
      requirements,
      personaIndexMap,
      useCaseIndexMap,
      feedbackIndexMap,
      outcomeIndexMap,
      requirementIndexMap: _requirementIndexMap,
      teamId,
      sourceType,
      metadata,
      useCaseSolutionIds,
      feedbackSolutionIds,
      outcomeSolutionIds,
      pendingMerges,
      pendingUseCaseMerges,
      pendingFeedbackMerges,
      pendingOutcomeMerges,
    }: SaveIntakeResultParams): Promise<boolean> => {
      setIsSaving(true);
      setError(null);

      try {
        // Step 0: Create IntakeSource first
        const intakeSourceDto = metadataToIntakeSource(teamId, sourceType, metadata);
        const intakeSource = await intakeSourceApi.create(intakeSourceDto);

        // Step 0.5: Execute pending persona merges (merges from intake flow that were deferred until save)
        // This merges intake data INTO the existing persona (target), adding this intake source
        // Build map from original intake persona index → merged persona ID for linking use cases/feedback
        const mergedPersonaIdMap = new Map<number, string>();
        for (const pendingMerge of pendingMerges) {
          const mergedPersona = await personaApi.merge({
            teamId,
            targetPersonaId: pendingMerge.targetPersonaId,
            sourcePersonaIds: pendingMerge.sourcePersonaIds,
            mergedPersona: pendingMerge.mergedPersona,
            additionalIntakeSourceIds: [intakeSource.id],
            quotes: pendingMerge.quotes,
          });
          mergedPersonaIdMap.set(pendingMerge.intakePersonaIndex, mergedPersona.id);
        }

        // Step 0.75: Execute pending use case merges (merges from intake flow that were deferred until save)
        // This merges existing use cases with intake data, adding this intake source to the merged use case
        // Build map from original intake use case index → merged use case ID for linking feedback
        const mergedUseCaseIdMap = new Map<number, string>();
        for (const pendingMerge of pendingUseCaseMerges) {
          const mergedUseCase = await useCaseApi.merge({
            teamId,
            targetUseCaseId: pendingMerge.targetUseCaseId,
            sourceUseCaseIds: pendingMerge.sourceUseCaseIds,
            mergedUseCase: pendingMerge.mergedUseCase,
            additionalIntakeSourceIds: [intakeSource.id],
            quotes: pendingMerge.quotes,
          });
          mergedUseCaseIdMap.set(pendingMerge.intakeUseCaseIndex, mergedUseCase.id);
        }

        // Step 1: Create all personas and build ID map
        const createdPersonas = await Promise.all(
          personas.map((persona) => {
            const dto: CreatePersonaDto = {
              teamId,
              intakeSourceIds: [intakeSource.id],
              name: persona.name,
              description: persona.description,
              role: persona.role,
              goals: persona.goals,
              painPoints: persona.painPoints,
              demographics: persona.demographics,
              quotes: persona.quotes,
            };
            return personaApi.create(dto);
          })
        );

        // Map from filtered index to created persona ID
        const personaIdMap = new Map<number, string>();
        createdPersonas.forEach((persona, filteredIndex) => {
          personaIdMap.set(filteredIndex, persona.id);
        });

        // Helper to resolve persona ID from original index
        const resolvePersonaId = (originalPersonaIndex: number): string | null => {
          // First check if this persona was merged
          const mergedPersonaId = mergedPersonaIdMap.get(originalPersonaIndex);
          if (mergedPersonaId) return mergedPersonaId;

          // Otherwise, check created personas
          const filteredPersonaIndex = personaIndexMap.get(originalPersonaIndex);
          if (filteredPersonaIndex === undefined) return null; // Persona was deleted

          return personaIdMap.get(filteredPersonaIndex) ?? null;
        };

        // Step 2: Create all use cases with linked persona IDs
        // Build reverse map: filtered index -> original index
        const useCaseFilteredToOriginal = new Map<number, number>();
        for (const [original, filtered] of useCaseIndexMap.entries()) {
          useCaseFilteredToOriginal.set(filtered, original);
        }

        const createdUseCases = await Promise.all(
          useCases.map((useCase, filteredIndex) => {
            const originalIndex = useCaseFilteredToOriginal.get(filteredIndex);
            const solutionId = originalIndex !== undefined
              ? useCaseSolutionIds.get(originalIndex) ?? null
              : null;

            // Resolve linked persona IDs
            const personaIds = useCase.linkedPersonaIndexes
              .map(resolvePersonaId)
              .filter((id): id is string => id !== null);

            const dto: CreateUseCaseDto = {
              teamId,
              intakeSourceId: intakeSource.id,
              name: useCase.name,
              description: useCase.description,
              solutionId: solutionId ?? undefined,
              quotes: useCase.quotes,
              personaIds: personaIds.length > 0 ? personaIds : undefined,
            };
            return useCaseApi.create(dto);
          })
        );

        // Map from filtered index to created use case ID
        const useCaseIdMap = new Map<number, string>();
        createdUseCases.forEach((useCase, filteredIndex) => {
          useCaseIdMap.set(filteredIndex, useCase.id);
        });

        // Helper to resolve use case ID from original index
        const resolveUseCaseId = (originalUseCaseIndex: number): string | null => {
          // First check if this use case was merged
          const mergedUseCaseId = mergedUseCaseIdMap.get(originalUseCaseIndex);
          if (mergedUseCaseId) return mergedUseCaseId;

          // Otherwise, check created use cases
          const filteredUseCaseIndex = useCaseIndexMap.get(originalUseCaseIndex);
          if (filteredUseCaseIndex === undefined) return null; // Use case was deleted

          return useCaseIdMap.get(filteredUseCaseIndex) ?? null;
        };

        // Step 3: Create all feedbacks with linked persona and use case IDs
        // Build reverse map: filtered index -> original index
        const feedbackFilteredToOriginal = new Map<number, number>();
        for (const [original, filtered] of feedbackIndexMap.entries()) {
          feedbackFilteredToOriginal.set(filtered, original);
        }

        const createdFeedbacks = await Promise.all(
          feedback.map((fb, filteredIndex) => {
            const originalIndex = feedbackFilteredToOriginal.get(filteredIndex);
            const solutionId = originalIndex !== undefined
              ? feedbackSolutionIds.get(originalIndex) ?? null
              : null;

            // Resolve linked persona IDs
            const personaIds = fb.linkedPersonaIndexes
              .map(resolvePersonaId)
              .filter((id): id is string => id !== null);

            // Resolve linked use case IDs
            const useCaseIds = fb.linkedUseCaseIndexes
              .map(resolveUseCaseId)
              .filter((id): id is string => id !== null);

            const dto: CreateFeedbackDto = {
              teamId,
              solutionId,
              intakeSourceId: intakeSource.id,
              type: fb.type,
              content: fb.content,
              quotes: fb.quotes,
              personaIds: personaIds.length > 0 ? personaIds : undefined,
              useCaseIds: useCaseIds.length > 0 ? useCaseIds : undefined,
            };
            return feedbackApi.create(dto);
          })
        );

        // Map from filtered index to created feedback ID (for reference if needed)
        const feedbackIdMap = new Map<number, string>();
        createdFeedbacks.forEach((fb, filteredIndex) => {
          feedbackIdMap.set(filteredIndex, fb.id);
        });

        // Step 4: Execute pending feedback merges (create feedback with links, then merge as child)
        for (const pendingMerge of pendingFeedbackMerges) {
          const fb = pendingMerge.intakeFeedback;
          const solutionId = feedbackSolutionIds.get(pendingMerge.intakeFeedbackIndex) ?? null;

          // Resolve linked persona IDs
          const personaIds = fb.linkedPersonaIndexes
            .map(resolvePersonaId)
            .filter((id): id is string => id !== null);

          // Resolve linked use case IDs
          const useCaseIds = fb.linkedUseCaseIndexes
            .map(resolveUseCaseId)
            .filter((id): id is string => id !== null);

          // Create the feedback with linked IDs
          const createdFeedback = await feedbackApi.create({
            teamId,
            solutionId,
            intakeSourceId: intakeSource.id,
            type: fb.type,
            content: fb.content,
            quotes: fb.quotes,
            personaIds: personaIds.length > 0 ? personaIds : undefined,
            useCaseIds: useCaseIds.length > 0 ? useCaseIds : undefined,
          });

          // Merge as child of existing feedback
          await feedbackApi.merge({
            teamId,
            parentFeedbackId: pendingMerge.parentFeedbackId,
            childFeedbackIds: [createdFeedback.id],
          });
        }

        // Step 5: Create all outcomes
        // Build reverse map: filtered index -> original index
        const outcomeFilteredToOriginal = new Map<number, number>();
        for (const [original, filtered] of outcomeIndexMap.entries()) {
          outcomeFilteredToOriginal.set(filtered, original);
        }

        await Promise.all(
          outcomes.map((outcome, filteredIndex) => {
            const originalIndex = outcomeFilteredToOriginal.get(filteredIndex);
            const solutionId = originalIndex !== undefined
              ? outcomeSolutionIds.get(originalIndex) ?? null
              : null;

            const dto: CreateOutcomeDto = {
              teamId,
              solutionId,
              intakeSourceId: intakeSource.id,
              description: outcome.description,
              target: outcome.target,
              quotes: outcome.quotes,
            };
            return outcomeApi.create(dto);
          })
        );

        // Step 5.5: Execute pending outcome merges (create outcome with links, then merge as child)
        for (const pendingMerge of pendingOutcomeMerges) {
          const out = pendingMerge.intakeOutcome;
          const solutionId = outcomeSolutionIds.get(pendingMerge.intakeOutcomeIndex) ?? null;

          // Create the outcome first
          const createdOutcome = await outcomeApi.create({
            teamId,
            solutionId,
            intakeSourceId: intakeSource.id,
            description: out.description,
            target: out.target,
            quotes: out.quotes,
          });

          // Merge as child of existing outcome
          await outcomeApi.merge({
            teamId,
            parentOutcomeId: pendingMerge.parentOutcomeId,
            childOutcomeIds: [createdOutcome.id],
          });
        }

        // Step 6: Create all requirements (standalone - no UseCaseId)
        if (requirements && requirements.length > 0) {
          await Promise.all(
            requirements.map((requirement) => {
              const dto: CreateRequirementDto = {
                teamId,
                intakeSourceId: intakeSource.id,
                text: requirement.text,
                type: requirement.type,
                status: 'Todo',
                quotes: requirement.quotes,
              };
              return requirementApi.create(dto);
            })
          );
        }

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to save intake results';
        setError(errorMessage);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  return { saveIntakeResult, isSaving, error };
}

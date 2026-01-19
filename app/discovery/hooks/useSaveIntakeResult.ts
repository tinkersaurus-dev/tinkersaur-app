import { useState, useCallback } from 'react';
import type { ExtractedPersona, ExtractedUseCase, ExtractedFeedback, ExtractedOutcome, SourceTypeKey } from '~/core/entities/discovery';
import { metadataToIntakeSource } from '~/core/entities/discovery';
import type { CreatePersonaDto, MergedPersonaData } from '~/core/entities/product-management/types/Persona';
import type { CreateUseCaseDto, MergedUseCaseData } from '~/core/entities/product-management/types/UseCase';
import type { CreateFeedbackDto } from '~/core/entities/discovery/types/Feedback';
import type { CreateOutcomeDto } from '~/core/entities/discovery/types/Outcome';
import { personaApi } from '~/core/entities/product-management/api/personaApi';
import { useCaseApi } from '~/core/entities/product-management/api/useCaseApi';
import { feedbackApi } from '~/core/entities/discovery/api/feedbackApi';
import { outcomeApi } from '~/core/entities/discovery/api/outcomeApi';
import { intakeSourceApi } from '~/core/entities/discovery/api/intakeSourceApi';

export interface PendingMerge {
  intakePersonaIndex: number;
  targetPersonaId: string;  // The existing persona being merged INTO
  sourcePersonaIds: string[];  // Usually empty for intake merge (no source personas)
  mergedPersona: MergedPersonaData;
}

export interface PendingUseCaseMerge {
  intakeUseCaseIndex: number;
  targetUseCaseId: string;
  sourceUseCaseIds: string[];
  mergedUseCase: MergedUseCaseData;
}

export interface PendingFeedbackMerge {
  intakeFeedbackIndex: number;
  parentFeedbackId: string;
  intakeFeedback: ExtractedFeedback;
}

interface SaveIntakeResultParams {
  personas: ExtractedPersona[];
  useCases: ExtractedUseCase[];
  feedback: ExtractedFeedback[];
  outcomes: ExtractedOutcome[];
  personaIndexMap: Map<number, number>;
  useCaseIndexMap: Map<number, number>;
  feedbackIndexMap: Map<number, number>;
  outcomeIndexMap: Map<number, number>;
  teamId: string;
  sourceType: SourceTypeKey;
  metadata: Record<string, string>;
  useCaseSolutionIds: Map<number, string | null>;
  feedbackSolutionIds: Map<number, string | null>;
  outcomeSolutionIds: Map<number, string | null>;
  pendingMerges: PendingMerge[];
  pendingUseCaseMerges: PendingUseCaseMerge[];
  pendingFeedbackMerges: PendingFeedbackMerge[];
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
      personaIndexMap,
      useCaseIndexMap,
      feedbackIndexMap,
      outcomeIndexMap,
      teamId,
      sourceType,
      metadata,
      useCaseSolutionIds,
      feedbackSolutionIds,
      outcomeSolutionIds,
      pendingMerges,
      pendingUseCaseMerges,
      pendingFeedbackMerges,
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

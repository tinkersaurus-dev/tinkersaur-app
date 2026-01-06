import { useState, useCallback } from 'react';
import type { ExtractedPersona, ExtractedUseCase, ExtractedFeedback, SourceTypeKey } from '~/core/entities/discovery';
import { metadataToIntakeSource } from '~/core/entities/discovery';
import type { CreatePersonaDto } from '~/core/entities/product-management/types/Persona';
import type { CreateUseCaseDto } from '~/core/entities/product-management/types/UseCase';
import type { CreateFeedbackDto } from '~/core/entities/discovery/types/Feedback';
import { personaApi } from '~/core/entities/product-management/api/personaApi';
import { useCaseApi } from '~/core/entities/product-management/api/useCaseApi';
import { feedbackApi } from '~/core/entities/discovery/api/feedbackApi';
import { intakeSourceApi } from '~/core/entities/discovery/api/intakeSourceApi';
import { personaUseCaseApi } from '~/core/entities/product-management/api/personaUseCaseApi';
import { feedbackPersonaApi } from '~/core/entities/discovery/api/feedbackPersonaApi';
import { feedbackUseCaseApi } from '~/core/entities/discovery/api/feedbackUseCaseApi';

interface SaveIntakeResultParams {
  personas: ExtractedPersona[];
  useCases: ExtractedUseCase[];
  feedback: ExtractedFeedback[];
  personaIndexMap: Map<number, number>;
  useCaseIndexMap: Map<number, number>;
  teamId: string;
  sourceType: SourceTypeKey;
  metadata: Record<string, string>;
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
      personaIndexMap,
      useCaseIndexMap,
      teamId,
      sourceType,
      metadata,
    }: SaveIntakeResultParams): Promise<boolean> => {
      setIsSaving(true);
      setError(null);

      try {
        // Step 0: Create IntakeSource first
        const intakeSourceDto = metadataToIntakeSource(teamId, sourceType, metadata);
        const intakeSource = await intakeSourceApi.create(intakeSourceDto);

        // Step 1: Create all personas and build ID map
        const createdPersonas = await Promise.all(
          personas.map((persona) => {
            const dto: CreatePersonaDto = {
              teamId,
              intakeSourceId: intakeSource.id,
              name: persona.name,
              description: persona.description,
              role: persona.role,
              goals: persona.goals,
              painPoints: persona.painPoints,
              demographics: persona.demographics,
            };
            return personaApi.create(dto);
          })
        );

        // Map from filtered index to created persona ID
        const personaIdMap = new Map<number, string>();
        createdPersonas.forEach((persona, filteredIndex) => {
          personaIdMap.set(filteredIndex, persona.id);
        });

        // Step 2: Create all use cases and build ID map
        const createdUseCases = await Promise.all(
          useCases.map((useCase) => {
            const dto: CreateUseCaseDto = {
              teamId,
              intakeSourceId: intakeSource.id,
              name: useCase.name,
              description: useCase.description,
            };
            return useCaseApi.create(dto);
          })
        );

        // Map from filtered index to created use case ID
        const useCaseIdMap = new Map<number, string>();
        createdUseCases.forEach((useCase, filteredIndex) => {
          useCaseIdMap.set(filteredIndex, useCase.id);
        });

        // Step 3: Create PersonaUseCase junction entries
        const personaUseCasePromises: Promise<unknown>[] = [];
        useCases.forEach((useCase, filteredUseCaseIndex) => {
          const useCaseId = useCaseIdMap.get(filteredUseCaseIndex);
          if (!useCaseId) return;

          useCase.linkedPersonaIndexes.forEach((originalPersonaIndex) => {
            // Get the new filtered index for this original persona index
            const filteredPersonaIndex = personaIndexMap.get(originalPersonaIndex);
            if (filteredPersonaIndex === undefined) return; // Persona was deleted

            const personaId = personaIdMap.get(filteredPersonaIndex);
            if (!personaId) return;

            personaUseCasePromises.push(
              personaUseCaseApi.create({ personaId, useCaseId })
            );
          });
        });
        await Promise.all(personaUseCasePromises);

        // Step 4: Create all feedbacks and build ID map
        const createdFeedbacks = await Promise.all(
          feedback.map((fb) => {
            const dto: CreateFeedbackDto = {
              teamId,
              solutionId: null,
              intakeSourceId: intakeSource.id,
              type: fb.type,
              content: fb.content,
              context: fb.context ?? null,
              quotes: fb.quotes,
              confidence: fb.confidence,
            };
            return feedbackApi.create(dto);
          })
        );

        // Map from filtered index to created feedback ID
        const feedbackIdMap = new Map<number, string>();
        createdFeedbacks.forEach((fb, filteredIndex) => {
          feedbackIdMap.set(filteredIndex, fb.id);
        });

        // Step 5: Create FeedbackPersona junction entries
        const feedbackPersonaPromises: Promise<unknown>[] = [];
        feedback.forEach((fb, filteredFeedbackIndex) => {
          const feedbackId = feedbackIdMap.get(filteredFeedbackIndex);
          if (!feedbackId) return;

          fb.linkedPersonaIndexes.forEach((originalPersonaIndex) => {
            const filteredPersonaIndex = personaIndexMap.get(originalPersonaIndex);
            if (filteredPersonaIndex === undefined) return; // Persona was deleted

            const personaId = personaIdMap.get(filteredPersonaIndex);
            if (!personaId) return;

            feedbackPersonaPromises.push(
              feedbackPersonaApi.create({ feedbackId, personaId })
            );
          });
        });
        await Promise.all(feedbackPersonaPromises);

        // Step 6: Create FeedbackUseCase junction entries
        const feedbackUseCasePromises: Promise<unknown>[] = [];
        feedback.forEach((fb, filteredFeedbackIndex) => {
          const feedbackId = feedbackIdMap.get(filteredFeedbackIndex);
          if (!feedbackId) return;

          fb.linkedUseCaseIndexes.forEach((originalUseCaseIndex) => {
            const filteredUseCaseIndex = useCaseIndexMap.get(originalUseCaseIndex);
            if (filteredUseCaseIndex === undefined) return; // Use case was deleted

            const useCaseId = useCaseIdMap.get(filteredUseCaseIndex);
            if (!useCaseId) return;

            feedbackUseCasePromises.push(
              feedbackUseCaseApi.create({ feedbackId, useCaseId })
            );
          });
        });
        await Promise.all(feedbackUseCasePromises);

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

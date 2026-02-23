import { useState, useCallback } from 'react';
import type { ExtractedPersona } from '@/entities/intake-result';
import type { ExtractedUserGoal } from '@/entities/intake-result';
import type { ExtractedFeedback } from '@/entities/feedback';
import type { ExtractedOutcome } from '@/entities/outcome';
import type { ExtractedRequirement } from '@/entities/requirement';
import type { SourceTypeKey } from '@/entities/source-type';
import { metadataToIntakeSource, intakeSourceApi } from '@/entities/intake-source';
import { personaApi, type CreatePersonaDto } from '@/entities/persona';
import { userGoalApi, type CreateUserGoalDto } from '@/entities/user-goal';
import { feedbackApi, type CreateFeedbackDto } from '@/entities/feedback';
import { outcomeApi, type CreateOutcomeDto } from '@/entities/outcome';
import { requirementApi, type CreateRequirementDto } from '@/entities/requirement';
import type {
  PendingMerge,
  PendingUserGoalMerge,
  PendingFeedbackMerge,
  PendingOutcomeMerge,
} from '../model/types';

interface SaveIntakeResultParams {
  personas: ExtractedPersona[];
  userGoals: ExtractedUserGoal[];
  feedback: ExtractedFeedback[];
  outcomes: ExtractedOutcome[];
  requirements?: ExtractedRequirement[];
  personaIndexMap: Map<number, number>;
  userGoalIndexMap: Map<number, number>;
  feedbackIndexMap: Map<number, number>;
  outcomeIndexMap: Map<number, number>;
  requirementIndexMap?: Map<number, number>;
  teamId: string;
  sourceType: SourceTypeKey;
  metadata: Record<string, string>;
  feedbackSolutionIds: Map<number, string | null>;
  outcomeSolutionIds: Map<number, string | null>;
  pendingMerges: PendingMerge[];
  pendingUserGoalMerges: PendingUserGoalMerge[];
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
      userGoals,
      feedback,
      outcomes,
      requirements,
      personaIndexMap,
      userGoalIndexMap,
      feedbackIndexMap,
      outcomeIndexMap,
      requirementIndexMap: _requirementIndexMap,
      teamId,
      sourceType,
      metadata,
      feedbackSolutionIds,
      outcomeSolutionIds,
      pendingMerges,
      pendingUserGoalMerges,
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
        // Build map from original intake persona index → merged persona ID for linking user goals/feedback
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

        // Step 0.75: Execute pending user goal merges (merges from intake flow that were deferred until save)
        // This merges existing user goals with intake data, adding this intake source to the merged user goal
        // Build map from original intake user goal index → merged user goal ID for linking feedback
        const mergedUserGoalIdMap = new Map<number, string>();
        for (const pendingMerge of pendingUserGoalMerges) {
          const mergedUserGoal = await userGoalApi.merge({
            teamId,
            targetUserGoalId: pendingMerge.targetUserGoalId,
            sourceUserGoalIds: pendingMerge.sourceUserGoalIds,
            mergedUserGoal: pendingMerge.mergedUserGoal,
            additionalIntakeSourceIds: [intakeSource.id],
            quotes: pendingMerge.quotes,
          });
          mergedUserGoalIdMap.set(pendingMerge.intakeUserGoalIndex, mergedUserGoal.id);
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

        // Step 2: Create all user goals with linked persona IDs
        // Build reverse map: filtered index -> original index
        const userGoalFilteredToOriginal = new Map<number, number>();
        for (const [original, filtered] of userGoalIndexMap.entries()) {
          userGoalFilteredToOriginal.set(filtered, original);
        }

        const createdUserGoals = await Promise.all(
          userGoals.map((userGoal) => {
            // Resolve linked persona IDs
            const personaIds = userGoal.linkedPersonaIndexes
              .map(resolvePersonaId)
              .filter((id): id is string => id !== null);

            const dto: CreateUserGoalDto = {
              teamId,
              intakeSourceId: intakeSource.id,
              name: userGoal.name,
              description: userGoal.description,
              quotes: userGoal.quotes,
              personaIds: personaIds.length > 0 ? personaIds : undefined,
            };
            return userGoalApi.create(dto);
          })
        );

        // Map from filtered index to created user goal ID
        const userGoalIdMap = new Map<number, string>();
        createdUserGoals.forEach((userGoal, filteredIndex) => {
          userGoalIdMap.set(filteredIndex, userGoal.id);
        });

        // Helper to resolve user goal ID from original index
        const resolveUserGoalId = (originalUserGoalIndex: number): string | null => {
          // First check if this user goal was merged
          const mergedUserGoalId = mergedUserGoalIdMap.get(originalUserGoalIndex);
          if (mergedUserGoalId) return mergedUserGoalId;

          // Otherwise, check created user goals
          const filteredUserGoalIndex = userGoalIndexMap.get(originalUserGoalIndex);
          if (filteredUserGoalIndex === undefined) return null; // User goal was deleted

          return userGoalIdMap.get(filteredUserGoalIndex) ?? null;
        };

        // Step 3: Create all feedbacks with linked persona and user goal IDs
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

            // Resolve linked user goal IDs
            const userGoalIds = fb.linkedUserGoalIndexes
              .map(resolveUserGoalId)
              .filter((id): id is string => id !== null);

            const dto: CreateFeedbackDto = {
              teamId,
              solutionId,
              intakeSourceId: intakeSource.id,
              type: fb.type,
              content: fb.content,
              quotes: fb.quotes,
              personaIds: personaIds.length > 0 ? personaIds : undefined,
              userGoalIds: userGoalIds.length > 0 ? userGoalIds : undefined,
              tags: fb.tags && fb.tags.length > 0 ? fb.tags : undefined,
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

          // Resolve linked user goal IDs
          const userGoalIds = fb.linkedUserGoalIndexes
            .map(resolveUserGoalId)
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
            userGoalIds: userGoalIds.length > 0 ? userGoalIds : undefined,
            tags: fb.tags && fb.tags.length > 0 ? fb.tags : undefined,
          });

          // Merge as child of existing feedback
          await feedbackApi.merge({
            teamId,
            parentFeedbackId: pendingMerge.parentFeedbackId,
            childFeedbackIds: [createdFeedback.id],
          });
        }

        // Step 5: Create all outcomes with linked persona and user goal IDs
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

            // Resolve linked persona IDs
            const personaIds = outcome.linkedPersonaIndexes
              .map(resolvePersonaId)
              .filter((id): id is string => id !== null);

            // Resolve linked user goal IDs
            const userGoalIds = outcome.linkedUserGoalIndexes
              .map(resolveUserGoalId)
              .filter((id): id is string => id !== null);

            const dto: CreateOutcomeDto = {
              teamId,
              solutionId,
              intakeSourceId: intakeSource.id,
              description: outcome.description,
              target: outcome.target,
              quotes: outcome.quotes,
              personaIds: personaIds.length > 0 ? personaIds : undefined,
              userGoalIds: userGoalIds.length > 0 ? userGoalIds : undefined,
            };
            return outcomeApi.create(dto);
          })
        );

        // Step 5.5: Execute pending outcome merges (create outcome with links, then merge as child)
        for (const pendingMerge of pendingOutcomeMerges) {
          const out = pendingMerge.intakeOutcome;
          const solutionId = outcomeSolutionIds.get(pendingMerge.intakeOutcomeIndex) ?? null;

          // Resolve linked persona IDs
          const personaIds = out.linkedPersonaIndexes
            .map(resolvePersonaId)
            .filter((id): id is string => id !== null);

          // Resolve linked user goal IDs
          const userGoalIds = out.linkedUserGoalIndexes
            .map(resolveUserGoalId)
            .filter((id): id is string => id !== null);

          // Create the outcome with linked IDs
          const createdOutcome = await outcomeApi.create({
            teamId,
            solutionId,
            intakeSourceId: intakeSource.id,
            description: out.description,
            target: out.target,
            quotes: out.quotes,
            personaIds: personaIds.length > 0 ? personaIds : undefined,
            userGoalIds: userGoalIds.length > 0 ? userGoalIds : undefined,
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

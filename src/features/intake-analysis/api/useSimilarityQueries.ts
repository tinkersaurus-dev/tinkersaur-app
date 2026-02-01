import { personaApi } from '@/entities/persona';
import { useCaseApi } from '@/entities/use-case';
import { feedbackApi } from '@/entities/feedback';
import { outcomeApi } from '@/entities/outcome';
import { createBatchSimilarityQueryHook } from './createBatchSimilarityQueryHook';
import type { ExtractedPersona, ExtractedUseCase } from '@/entities/intake-result';
import type { ExtractedFeedback } from '@/entities/feedback';
import type { ExtractedOutcome } from '@/entities/outcome';
import type { SimilarPersonaInfo, SimilarUseCaseInfo, SimilarFeedbackInfo, SimilarOutcomeInfo } from '../lib/types/similarity';

/**
 * Query hook for finding similar personas
 */
export const useSimilarPersonasQuery = createBatchSimilarityQueryHook<
  ExtractedPersona,
  SimilarPersonaInfo['similarResults'][number],
  SimilarPersonaInfo
>({
  entityType: 'personas',
  getItemSignature: (p) => `${p.name}|${p.description?.slice(0, 100)}`,
  findSimilar: (persona, teamId) =>
    personaApi.findSimilar({
      teamId,
      name: persona.name,
      description: persona.description,
      role: persona.role,
      threshold: 0.5,
      limit: 5,
    }),
  createResultInfo: (persona, index, results) => ({
    personaIndex: index,
    personaName: persona.name,
    similarResults: results,
  }),
});

/**
 * Query hook for finding similar use cases
 */
export const useSimilarUseCasesQuery = createBatchSimilarityQueryHook<
  ExtractedUseCase,
  SimilarUseCaseInfo['similarResults'][number],
  SimilarUseCaseInfo
>({
  entityType: 'useCases',
  getItemSignature: (u) => `${u.name}|${u.description?.slice(0, 100)}`,
  findSimilar: (useCase, teamId) =>
    useCaseApi.findSimilar({
      teamId,
      name: useCase.name,
      description: useCase.description,
      threshold: 0.5,
      limit: 5,
    }),
  createResultInfo: (useCase, index, results) => ({
    useCaseIndex: index,
    useCaseName: useCase.name,
    similarResults: results,
  }),
});

/**
 * Query hook for finding similar feedback
 */
export const useSimilarFeedbackQuery = createBatchSimilarityQueryHook<
  ExtractedFeedback,
  SimilarFeedbackInfo['similarResults'][number],
  SimilarFeedbackInfo
>({
  entityType: 'feedback',
  getItemSignature: (f) => f.content?.slice(0, 100) ?? '',
  findSimilar: (feedback, teamId) =>
    feedbackApi.findSimilar({
      teamId,
      content: feedback.content,
      threshold: 0.5,
      limit: 5,
    }),
  createResultInfo: (feedback, index, results) => ({
    feedbackIndex: index,
    feedbackContent: feedback.content,
    similarResults: results,
  }),
});

/**
 * Query hook for finding similar outcomes
 */
export const useSimilarOutcomesQuery = createBatchSimilarityQueryHook<
  ExtractedOutcome,
  SimilarOutcomeInfo['similarResults'][number],
  SimilarOutcomeInfo
>({
  entityType: 'outcomes',
  getItemSignature: (o) => `${o.description?.slice(0, 100)}|${o.target?.slice(0, 50)}`,
  findSimilar: (outcome, teamId) =>
    outcomeApi.findSimilar({
      teamId,
      description: outcome.description,
      target: outcome.target,
      threshold: 0.5,
      limit: 5,
    }),
  createResultInfo: (outcome, index, results) => ({
    outcomeIndex: index,
    outcomeDescription: outcome.description,
    similarResults: results,
  }),
});

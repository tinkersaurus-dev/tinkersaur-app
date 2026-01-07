import { useQuery } from '@tanstack/react-query';
import { personaApi, useCaseApi } from '~/core/entities/product-management/api';
import { feedbackApi, outcomeApi } from '~/core/entities/discovery/api';
import type { ExtractedPersona, ExtractedUseCase, ExtractedFeedback, ExtractedOutcome } from '~/core/entities/discovery';
import type { SimilarPersonaInfo, SimilarUseCaseInfo, SimilarFeedbackInfo, SimilarOutcomeInfo } from '~/discovery/types';

const SIMILARITY_STALE_TIME = 60_000; // 1 minute

/**
 * Query hook for finding similar personas
 */
export function useSimilarPersonasQuery(
  personas: ExtractedPersona[] | null,
  teamId: string | undefined
) {
  return useQuery({
    queryKey: [
      'similarity',
      'personas',
      teamId,
      personas?.map((p) => `${p.name}|${p.description?.slice(0, 100)}`),
    ],
    queryFn: async (): Promise<SimilarPersonaInfo[]> => {
      const results = await Promise.all(
        personas!.map(async (persona, index) => {
          const similarResults = await personaApi.findSimilar({
            teamId: teamId!,
            name: persona.name,
            description: persona.description,
            role: persona.role,
            threshold: 0.5,
            limit: 5,
          });

          if (similarResults.length > 0) {
            return {
              personaIndex: index,
              personaName: persona.name,
              similarResults,
            };
          }
          return null;
        })
      );

      return results.filter((r): r is SimilarPersonaInfo => r !== null);
    },
    enabled: !!personas && !!teamId && personas.length > 0,
    staleTime: SIMILARITY_STALE_TIME,
  });
}

/**
 * Query hook for finding similar use cases
 */
export function useSimilarUseCasesQuery(
  useCases: ExtractedUseCase[] | null,
  teamId: string | undefined
) {
  return useQuery({
    queryKey: [
      'similarity',
      'useCases',
      teamId,
      useCases?.map((u) => `${u.name}|${u.description?.slice(0, 100)}`),
    ],
    queryFn: async (): Promise<SimilarUseCaseInfo[]> => {
      const results = await Promise.all(
        useCases!.map(async (useCase, index) => {
          const similarResults = await useCaseApi.findSimilar({
            teamId: teamId!,
            name: useCase.name,
            description: useCase.description,
            threshold: 0.5,
            limit: 5,
          });

          if (similarResults.length > 0) {
            return {
              useCaseIndex: index,
              useCaseName: useCase.name,
              similarResults,
            };
          }
          return null;
        })
      );

      return results.filter((r): r is SimilarUseCaseInfo => r !== null);
    },
    enabled: !!useCases && !!teamId && useCases.length > 0,
    staleTime: SIMILARITY_STALE_TIME,
  });
}

/**
 * Query hook for finding similar feedback
 */
export function useSimilarFeedbackQuery(
  feedbackItems: ExtractedFeedback[] | null,
  teamId: string | undefined
) {
  return useQuery({
    queryKey: [
      'similarity',
      'feedback',
      teamId,
      feedbackItems?.map((f) => f.content?.slice(0, 100)),
    ],
    queryFn: async (): Promise<SimilarFeedbackInfo[]> => {
      const results = await Promise.all(
        feedbackItems!.map(async (feedback, index) => {
          const similarResults = await feedbackApi.findSimilar({
            teamId: teamId!,
            content: feedback.content,
            threshold: 0.5,
            limit: 5,
          });

          if (similarResults.length > 0) {
            return {
              feedbackIndex: index,
              feedbackContent: feedback.content,
              similarResults,
            };
          }
          return null;
        })
      );

      return results.filter((r): r is SimilarFeedbackInfo => r !== null);
    },
    enabled: !!feedbackItems && !!teamId && feedbackItems.length > 0,
    staleTime: SIMILARITY_STALE_TIME,
  });
}

/**
 * Query hook for finding similar outcomes
 */
export function useSimilarOutcomesQuery(
  outcomeItems: ExtractedOutcome[] | null,
  teamId: string | undefined
) {
  return useQuery({
    queryKey: [
      'similarity',
      'outcomes',
      teamId,
      outcomeItems?.map((o) => `${o.description?.slice(0, 100)}|${o.target?.slice(0, 50)}`),
    ],
    queryFn: async (): Promise<SimilarOutcomeInfo[]> => {
      const results = await Promise.all(
        outcomeItems!.map(async (outcome, index) => {
          const similarResults = await outcomeApi.findSimilar({
            teamId: teamId!,
            description: outcome.description,
            target: outcome.target,
            threshold: 0.5,
            limit: 5,
          });

          if (similarResults.length > 0) {
            return {
              outcomeIndex: index,
              outcomeDescription: outcome.description,
              similarResults,
            };
          }
          return null;
        })
      );

      return results.filter((r): r is SimilarOutcomeInfo => r !== null);
    },
    enabled: !!outcomeItems && !!teamId && outcomeItems.length > 0,
    staleTime: SIMILARITY_STALE_TIME,
  });
}

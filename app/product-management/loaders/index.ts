/**
 * Route loaders for product management SSR data fetching
 * Uses TanStack Query prefetching for SSR with automatic hydration
 */

import { dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '~/core/query/queryClient';
import { queryKeys } from '~/core/query/queryKeys';
import { solutionApi, useCaseApi, requirementApi, personaApi } from '~/core/entities/product-management/api';
import { feedbackApi, outcomeApi } from '~/core/entities/discovery/api';
import { STALE_TIMES } from '~/core/query/queryClient';

// ============== TYPES ==============

export interface SolutionDetailLoaderData {
  dehydratedState: ReturnType<typeof dehydrate>;
  solutionId: string;
}

export interface UseCaseDetailLoaderData {
  dehydratedState: ReturnType<typeof dehydrate>;
  solutionId: string;
  useCaseId: string;
}

export interface PersonaDetailLoaderData {
  dehydratedState: ReturnType<typeof dehydrate>;
  personaId: string;
}

export interface DiscoveryUseCaseDetailLoaderData {
  dehydratedState: ReturnType<typeof dehydrate>;
  useCaseId: string;
}

export interface FeedbackDetailLoaderData {
  dehydratedState: ReturnType<typeof dehydrate>;
  feedbackId: string;
}

export interface OutcomeDetailLoaderData {
  dehydratedState: ReturnType<typeof dehydrate>;
  outcomeId: string;
}

// ============== LOADERS ==============

/**
 * Load solution and its use cases for solution-detail page
 * Prefetches queries that will be used by the page
 * Note: SSR prefetch may fail without auth token - client will refetch
 */
export async function loadSolutionDetail(solutionId: string): Promise<SolutionDetailLoaderData> {
  const queryClient = getQueryClient();

  try {
    // Prefetch solution and use cases in parallel
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.solutions.detail(solutionId),
        queryFn: () => solutionApi.get(solutionId),
        staleTime: STALE_TIMES.solutions,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.useCases.listBySolution(solutionId),
        queryFn: () => useCaseApi.listBySolution(solutionId),
        staleTime: STALE_TIMES.useCases,
      }),
    ]);
  } catch {
    // SSR prefetch failed (likely no auth token) - client will refetch
  }

  // Don't throw 404 on SSR - let client handle it with proper auth
  return {
    dehydratedState: dehydrate(queryClient),
    solutionId,
  };
}

/**
 * Load use case, its parent solution, and requirements for use-case-detail page
 * Note: SSR prefetch may fail without auth token - client will refetch
 */
export async function loadUseCaseDetail(
  solutionId: string,
  useCaseId: string
): Promise<UseCaseDetailLoaderData> {
  const queryClient = getQueryClient();

  try {
    // Parallel prefetch for better performance
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.solutions.detail(solutionId),
        queryFn: () => solutionApi.get(solutionId),
        staleTime: STALE_TIMES.solutions,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.useCases.detail(useCaseId),
        queryFn: () => useCaseApi.get(useCaseId),
        staleTime: STALE_TIMES.useCases,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.requirements.list(useCaseId),
        queryFn: () => requirementApi.list(useCaseId),
        staleTime: STALE_TIMES.requirements,
      }),
    ]);
  } catch {
    // SSR prefetch failed (likely no auth token) - client will refetch
  }

  // Don't throw 404 on SSR - let client handle it with proper auth
  return {
    dehydratedState: dehydrate(queryClient),
    solutionId,
    useCaseId,
  };
}

/**
 * Load persona for persona-detail page
 * Note: SSR prefetch may fail without auth token - client will refetch
 */
export async function loadPersonaDetail(personaId: string): Promise<PersonaDetailLoaderData> {
  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.personas.detail(personaId),
      queryFn: () => personaApi.get(personaId),
      staleTime: STALE_TIMES.personas,
    });
  } catch {
    // SSR prefetch failed (likely no auth token) - client will refetch
  }

  // Don't throw 404 on SSR - let client handle it with proper auth
  return {
    dehydratedState: dehydrate(queryClient),
    personaId,
  };
}

/**
 * Load use case for discovery-use-case-detail page
 * Does not require solutionId - standalone use case view
 * Note: SSR prefetch may fail without auth token - client will refetch
 */
export async function loadDiscoveryUseCaseDetail(useCaseId: string): Promise<DiscoveryUseCaseDetailLoaderData> {
  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.useCases.detail(useCaseId),
      queryFn: () => useCaseApi.get(useCaseId),
      staleTime: STALE_TIMES.useCases,
    });
  } catch {
    // SSR prefetch failed (likely no auth token) - client will refetch
  }

  // Don't throw 404 on SSR - let client handle it with proper auth
  return {
    dehydratedState: dehydrate(queryClient),
    useCaseId,
  };
}

/**
 * Load feedback with children for feedback-detail page
 * Note: SSR prefetch may fail without auth token - client will refetch
 */
export async function loadFeedbackDetail(feedbackId: string): Promise<FeedbackDetailLoaderData> {
  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.feedbacks.withChildren(feedbackId),
      queryFn: () => feedbackApi.getWithChildren(feedbackId),
      staleTime: STALE_TIMES.feedbacks,
    });
  } catch {
    // SSR prefetch failed (likely no auth token) - client will refetch
  }

  // Don't throw 404 on SSR - let client handle it with proper auth
  return {
    dehydratedState: dehydrate(queryClient),
    feedbackId,
  };
}

/**
 * Load outcome for outcome-detail page
 * Note: SSR prefetch may fail without auth token - client will refetch
 */
export async function loadOutcomeDetail(outcomeId: string): Promise<OutcomeDetailLoaderData> {
  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.outcomes.detail(outcomeId),
      queryFn: () => outcomeApi.get(outcomeId),
      staleTime: STALE_TIMES.outcomes,
    });
  } catch {
    // SSR prefetch failed (likely no auth token) - client will refetch
  }

  // Don't throw 404 on SSR - let client handle it with proper auth
  return {
    dehydratedState: dehydrate(queryClient),
    outcomeId,
  };
}

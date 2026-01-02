/**
 * Route loaders for product management SSR data fetching
 * Uses TanStack Query prefetching for SSR with automatic hydration
 */

import { dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '~/core/query/queryClient';
import { queryKeys } from '~/core/query/queryKeys';
import { solutionApi, useCaseApi, requirementApi, personaApi } from '~/core/entities/product-management/api';
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

// ============== LOADERS ==============

/**
 * Load solution and its use cases for solution-detail page
 * Prefetches queries that will be used by the page
 */
export async function loadSolutionDetail(solutionId: string): Promise<SolutionDetailLoaderData> {
  const queryClient = getQueryClient();

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

  // Check if solution was found
  const solution = queryClient.getQueryData(queryKeys.solutions.detail(solutionId));
  if (!solution) {
    throw new Response('Solution not found', { status: 404 });
  }

  return {
    dehydratedState: dehydrate(queryClient),
    solutionId,
  };
}

/**
 * Load use case, its parent solution, and requirements for use-case-detail page
 */
export async function loadUseCaseDetail(
  solutionId: string,
  useCaseId: string
): Promise<UseCaseDetailLoaderData> {
  const queryClient = getQueryClient();

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

  // Check if resources were found
  const solution = queryClient.getQueryData(queryKeys.solutions.detail(solutionId));
  const useCase = queryClient.getQueryData(queryKeys.useCases.detail(useCaseId));
  if (!solution || !useCase) {
    throw new Response('Resource not found', { status: 404 });
  }

  return {
    dehydratedState: dehydrate(queryClient),
    solutionId,
    useCaseId,
  };
}

/**
 * Load persona for persona-detail page
 */
export async function loadPersonaDetail(personaId: string): Promise<PersonaDetailLoaderData> {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: queryKeys.personas.detail(personaId),
    queryFn: () => personaApi.get(personaId),
    staleTime: STALE_TIMES.personas,
  });

  // Check if persona was found
  const persona = queryClient.getQueryData(queryKeys.personas.detail(personaId));
  if (!persona) {
    throw new Response('Persona not found', { status: 404 });
  }

  return {
    dehydratedState: dehydrate(queryClient),
    personaId,
  };
}

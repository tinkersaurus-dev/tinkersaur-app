/**
 * Solution Detail Page Loader
 * Prefetches solution and its use cases for SSR
 */

import { dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/shared/lib/query';
import { queryKeys } from '@/shared/lib/query';
import { solutionApi } from '@/entities/solution';
import { useCaseApi } from '@/entities/use-case';
import { STALE_TIMES } from '@/shared/lib/query';

export interface SolutionDetailLoaderData {
  dehydratedState: ReturnType<typeof dehydrate>;
  solutionId: string;
}

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

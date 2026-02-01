/**
 * Use Case Detail Page Loader (Solutions Context)
 * Prefetches use case, solution, and requirements for SSR
 */

import { dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/shared/lib/query';
import { queryKeys } from '@/shared/lib/query';
import { solutionApi } from '@/entities/solution';
import { useCaseApi } from '@/entities/use-case';
import { requirementApi } from '@/entities/requirement';
import { STALE_TIMES } from '@/shared/lib/query';

export interface UseCaseDetailLoaderData {
  dehydratedState: ReturnType<typeof dehydrate>;
  solutionId: string;
  useCaseId: string;
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

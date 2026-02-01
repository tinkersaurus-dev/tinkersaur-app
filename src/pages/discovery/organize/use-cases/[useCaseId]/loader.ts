/**
 * Discovery Use Case Detail Page Loader
 * Prefetches use case data for SSR (discovery context - no solutionId)
 */

import { dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/shared/lib/query';
import { queryKeys } from '@/shared/lib/query';
import { useCaseApi } from '@/entities/use-case';
import { STALE_TIMES } from '@/shared/lib/query';

export interface DiscoveryUseCaseDetailLoaderData {
  dehydratedState: ReturnType<typeof dehydrate>;
  useCaseId: string;
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

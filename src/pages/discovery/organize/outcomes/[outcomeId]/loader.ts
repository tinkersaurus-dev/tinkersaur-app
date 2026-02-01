/**
 * Outcome Detail Page Loader
 * Prefetches outcome data for SSR
 */

import { dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/shared/lib/query';
import { queryKeys } from '@/shared/lib/query';
import { outcomeApi } from '@/entities/outcome';
import { STALE_TIMES } from '@/shared/lib/query';

export interface OutcomeDetailLoaderData {
  dehydratedState: ReturnType<typeof dehydrate>;
  outcomeId: string;
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

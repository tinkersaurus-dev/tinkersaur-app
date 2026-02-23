/**
 * Discovery User Goal Detail Page Loader
 * Prefetches user goal data for SSR (discovery context)
 */

import { dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/shared/lib/query';
import { queryKeys } from '@/shared/lib/query';
import { userGoalApi } from '@/entities/user-goal';
import { STALE_TIMES } from '@/shared/lib/query';

export interface DiscoveryUserGoalDetailLoaderData {
  dehydratedState: ReturnType<typeof dehydrate>;
  userGoalId: string;
}

/**
 * Load user goal for discovery-user-goal-detail page
 * Note: SSR prefetch may fail without auth token - client will refetch
 */
export async function loadDiscoveryUserGoalDetail(userGoalId: string): Promise<DiscoveryUserGoalDetailLoaderData> {
  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.userGoals.detail(userGoalId),
      queryFn: () => userGoalApi.get(userGoalId),
      staleTime: STALE_TIMES.userGoals,
    });
  } catch {
    // SSR prefetch failed (likely no auth token) - client will refetch
  }

  // Don't throw 404 on SSR - let client handle it with proper auth
  return {
    dehydratedState: dehydrate(queryClient),
    userGoalId,
  };
}

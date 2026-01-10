import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { solutionOverviewApi } from '~/core/entities/product-management/api';

/**
 * Query hook for fetching solution overview by solution ID
 */
export function useSolutionOverviewQuery(solutionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.solutionOverviews.bySolution(solutionId!),
    queryFn: () => solutionOverviewApi.getBySolutionId(solutionId!),
    enabled: !!solutionId,
    staleTime: STALE_TIMES.solutionOverviews,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Prefetch solution overview for SSR
 */
export function prefetchSolutionOverview(solutionId: string) {
  return {
    queryKey: queryKeys.solutionOverviews.bySolution(solutionId),
    queryFn: () => solutionOverviewApi.getBySolutionId(solutionId),
    staleTime: STALE_TIMES.solutionOverviews,
  };
}

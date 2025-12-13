import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { solutionApi } from '~/core/entities/product-management/api';

/**
 * Query hook for fetching solutions by team
 */
export function useSolutionsQuery(teamId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.solutions.list(teamId!),
    queryFn: () => solutionApi.list(teamId!),
    enabled: !!teamId,
    staleTime: STALE_TIMES.solutions,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Query hook for fetching a single solution
 */
export function useSolutionQuery(solutionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.solutions.detail(solutionId!),
    queryFn: () => solutionApi.get(solutionId!),
    enabled: !!solutionId,
    staleTime: STALE_TIMES.solutions,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Prefetch solutions for SSR
 */
export function prefetchSolutions(teamId: string) {
  return {
    queryKey: queryKeys.solutions.list(teamId),
    queryFn: () => solutionApi.list(teamId),
    staleTime: STALE_TIMES.solutions,
  };
}

/**
 * Prefetch a single solution for SSR
 */
export function prefetchSolution(solutionId: string) {
  return {
    queryKey: queryKeys.solutions.detail(solutionId),
    queryFn: () => solutionApi.get(solutionId),
    staleTime: STALE_TIMES.solutions,
  };
}

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { solutionFactorApi } from '~/core/entities/product-management/api';
import type { SolutionFactorType } from '~/core/entities/product-management/types';

/**
 * Query hook for fetching all solution factors by solution ID
 */
export function useSolutionFactorsQuery(solutionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.solutionFactors.bySolution(solutionId!),
    queryFn: () => solutionFactorApi.getBySolutionId(solutionId!),
    enabled: !!solutionId,
    staleTime: STALE_TIMES.solutionFactors,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Query hook for fetching solution factors by solution ID and type
 */
export function useSolutionFactorsByTypeQuery(
  solutionId: string | undefined,
  type: SolutionFactorType | undefined
) {
  return useQuery({
    queryKey: queryKeys.solutionFactors.bySolutionAndType(solutionId!, type!),
    queryFn: () => solutionFactorApi.getBySolutionIdAndType(solutionId!, type!),
    enabled: !!solutionId && !!type,
    staleTime: STALE_TIMES.solutionFactors,
  });
}

/**
 * Prefetch solution factors for SSR
 */
export function prefetchSolutionFactors(solutionId: string) {
  return {
    queryKey: queryKeys.solutionFactors.bySolution(solutionId),
    queryFn: () => solutionFactorApi.getBySolutionId(solutionId),
    staleTime: STALE_TIMES.solutionFactors,
  };
}

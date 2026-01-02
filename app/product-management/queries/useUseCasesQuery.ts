import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { useCaseApi } from '~/core/entities/product-management/api';

/**
 * Query hook for fetching use cases by team
 */
export function useUseCasesByTeamQuery(teamId: string | undefined, unassignedOnly = false) {
  return useQuery({
    queryKey: queryKeys.useCases.listByTeam(teamId!, unassignedOnly),
    queryFn: () => useCaseApi.listByTeam(teamId!, unassignedOnly),
    enabled: !!teamId,
    staleTime: STALE_TIMES.useCases,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Query hook for fetching use cases by solution
 */
export function useUseCasesBySolutionQuery(solutionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.useCases.listBySolution(solutionId!),
    queryFn: () => useCaseApi.listBySolution(solutionId!),
    enabled: !!solutionId,
    staleTime: STALE_TIMES.useCases,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * @deprecated Use useUseCasesBySolutionQuery instead
 */
export const useUseCasesQuery = useUseCasesBySolutionQuery;

/**
 * Query hook for fetching a single use case
 */
export function useUseCaseQuery(useCaseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.useCases.detail(useCaseId!),
    queryFn: () => useCaseApi.get(useCaseId!),
    enabled: !!useCaseId,
    staleTime: STALE_TIMES.useCases,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Prefetch use cases by team for SSR
 */
export function prefetchUseCasesByTeam(teamId: string, unassignedOnly = false) {
  return {
    queryKey: queryKeys.useCases.listByTeam(teamId, unassignedOnly),
    queryFn: () => useCaseApi.listByTeam(teamId, unassignedOnly),
    staleTime: STALE_TIMES.useCases,
  };
}

/**
 * Prefetch use cases by solution for SSR
 */
export function prefetchUseCasesBySolution(solutionId: string) {
  return {
    queryKey: queryKeys.useCases.listBySolution(solutionId),
    queryFn: () => useCaseApi.listBySolution(solutionId),
    staleTime: STALE_TIMES.useCases,
  };
}

/**
 * @deprecated Use prefetchUseCasesBySolution instead
 */
export const prefetchUseCases = prefetchUseCasesBySolution;

/**
 * Prefetch a single use case for SSR
 */
export function prefetchUseCase(useCaseId: string) {
  return {
    queryKey: queryKeys.useCases.detail(useCaseId),
    queryFn: () => useCaseApi.get(useCaseId),
    staleTime: STALE_TIMES.useCases,
  };
}

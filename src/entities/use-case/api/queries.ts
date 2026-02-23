import { useQuery, useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES } from '@/shared/lib/query';
import { createPaginatedQueryHook } from '@/shared/lib/query';
import { useCaseApi } from './useCaseApi';
import type { UseCase } from '../model/types';
import type { UseCaseListParams } from '@/shared/api';

/**
 * Query hook for fetching use cases by team
 */
export function useUseCasesByTeamQuery(teamId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.useCases.listByTeam(teamId!),
    queryFn: () => useCaseApi.listByTeam(teamId!),
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
export function prefetchUseCasesByTeam(teamId: string) {
  return {
    queryKey: queryKeys.useCases.listByTeam(teamId),
    queryFn: () => useCaseApi.listByTeam(teamId),
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

/**
 * Query hook for fetching paginated use cases
 */
export const useUseCasesPaginatedQuery = createPaginatedQueryHook({
  entityName: 'useCases',
  getQueryKey: (params: UseCaseListParams) => queryKeys.useCases.listPaginated(params),
  queryFn: (params: UseCaseListParams) => useCaseApi.listPaginated(params),
  staleTimeKey: 'useCases',
});

/**
 * Hook to fetch multiple use case details in parallel
 * Returns data as a map for easy lookup by ID
 */
export function useUseCaseDetailsQuery(useCaseIds: string[] | undefined) {
  const ids = useMemo(() => useCaseIds ?? [], [useCaseIds]);

  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: queryKeys.useCases.detail(id),
      queryFn: () => useCaseApi.get(id),
      staleTime: STALE_TIMES.useCases,
      enabled: !!id,
    })),
  });

  const dataMap = useMemo(() => {
    const map: Record<string, UseCase> = {};
    queries.forEach((query, index) => {
      if (query.data) {
        map[ids[index]] = query.data;
      }
    });
    return map;
  }, [queries, ids]);

  const nameMap = useMemo(() => {
    const map: Record<string, string> = {};
    queries.forEach((query, index) => {
      if (query.data) {
        map[ids[index]] = query.data.name;
      }
    });
    return map;
  }, [queries, ids]);

  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);
  const errors = queries.filter((q) => q.error).map((q) => q.error);

  return {
    queries,
    dataMap,
    nameMap,
    data: Object.values(dataMap),
    isLoading,
    isError,
    errors,
  };
}

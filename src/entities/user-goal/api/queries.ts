import { useQuery, useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES } from '@/shared/lib/query';
import { createPaginatedQueryHook } from '@/shared/lib/query';
import { userGoalApi } from './userGoalApi';
import type { UserGoal } from '../model/types';
import type { UserGoalListParams } from '@/shared/api';

/**
 * Query hook for fetching user goals by team
 */
export function useUserGoalsByTeamQuery(teamId: string | undefined, solutionId?: string) {
  return useQuery({
    queryKey: queryKeys.userGoals.listByTeam(teamId!, solutionId),
    queryFn: () => userGoalApi.listByTeam(teamId!, solutionId),
    enabled: !!teamId,
    staleTime: STALE_TIMES.userGoals,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Query hook for fetching a single user goal
 */
export function useUserGoalQuery(userGoalId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.userGoals.detail(userGoalId!),
    queryFn: () => userGoalApi.get(userGoalId!),
    enabled: !!userGoalId,
    staleTime: STALE_TIMES.userGoals,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Prefetch user goals by team for SSR
 */
export function prefetchUserGoalsByTeam(teamId: string) {
  return {
    queryKey: queryKeys.userGoals.listByTeam(teamId),
    queryFn: () => userGoalApi.listByTeam(teamId),
    staleTime: STALE_TIMES.userGoals,
  };
}

/**
 * Prefetch a single user goal for SSR
 */
export function prefetchUserGoal(userGoalId: string) {
  return {
    queryKey: queryKeys.userGoals.detail(userGoalId),
    queryFn: () => userGoalApi.get(userGoalId),
    staleTime: STALE_TIMES.userGoals,
  };
}

/**
 * Query hook for fetching paginated user goals
 */
export const useUserGoalsPaginatedQuery = createPaginatedQueryHook({
  entityName: 'userGoals',
  getQueryKey: (params: UserGoalListParams) => queryKeys.userGoals.listPaginated(params),
  queryFn: (params: UserGoalListParams) => userGoalApi.listPaginated(params),
  staleTimeKey: 'userGoals',
});

/**
 * Hook to fetch multiple user goal details in parallel
 * Returns data as a map for easy lookup by ID
 */
export function useUserGoalDetailsQuery(userGoalIds: string[] | undefined) {
  const ids = useMemo(() => userGoalIds ?? [], [userGoalIds]);

  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: queryKeys.userGoals.detail(id),
      queryFn: () => userGoalApi.get(id),
      staleTime: STALE_TIMES.userGoals,
      enabled: !!id,
    })),
  });

  const dataMap = useMemo(() => {
    const map: Record<string, UserGoal> = {};
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

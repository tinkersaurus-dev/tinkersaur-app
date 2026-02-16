import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES } from '@/shared/lib/query';
import { outcomeApi } from './outcomeApi';
import type { OutcomeListParams } from '@/shared/api';

/**
 * Query hook for fetching outcomes by team
 */
export function useOutcomesQuery(teamId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.outcomes.list(teamId!),
    queryFn: () => outcomeApi.list(teamId!),
    enabled: !!teamId,
    staleTime: STALE_TIMES.outcomes,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Query hook for fetching a single outcome by ID
 */
export function useOutcomeQuery(outcomeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.outcomes.detail(outcomeId!),
    queryFn: () => outcomeApi.get(outcomeId!),
    enabled: !!outcomeId,
    staleTime: STALE_TIMES.outcomes,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Query hook for fetching paginated outcomes
 */
export function useOutcomesPaginatedQuery(params: OutcomeListParams | null) {
  return useQuery({
    queryKey: params ? queryKeys.outcomes.listPaginated(params) : ['outcomes', 'disabled'],
    queryFn: () => outcomeApi.listPaginated(params!),
    enabled: !!params?.teamId,
    staleTime: STALE_TIMES.outcomes,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: 'always',
  });
}

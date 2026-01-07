import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { outcomeApi } from '~/core/entities/discovery/api';
import type { OutcomeListParams } from '~/core/api/types';

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

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES } from '@/shared/lib/query';
import { outcomeApi } from '@/entities/outcome';
import type { OutcomeListParams } from '@/shared/api';

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

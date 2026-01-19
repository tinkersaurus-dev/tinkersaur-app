import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { outcomeApi } from '~/core/entities/discovery/api';

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

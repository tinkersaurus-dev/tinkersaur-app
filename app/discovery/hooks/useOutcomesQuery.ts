import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { outcomeApi } from '~/core/entities/discovery/api';

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

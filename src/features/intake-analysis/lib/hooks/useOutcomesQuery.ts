import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES } from '@/shared/lib/query';
import { outcomeApi } from '@/entities/outcome';

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

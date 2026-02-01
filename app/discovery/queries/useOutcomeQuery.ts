import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES } from '@/shared/lib/query';
import { outcomeApi } from '@/entities/outcome';

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

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES } from '@/shared/lib/query';
import { intakeSourceApi } from '@/entities/intake-source';

/**
 * Query hook for fetching a single intake source by ID
 */
export function useIntakeSourceQuery(intakeSourceId: string | undefined | null) {
  return useQuery({
    queryKey: queryKeys.intakeSources.detail(intakeSourceId!),
    queryFn: () => intakeSourceApi.get(intakeSourceId!),
    enabled: !!intakeSourceId,
    staleTime: STALE_TIMES.feedbacks,
    refetchOnWindowFocus: 'always',
  });
}

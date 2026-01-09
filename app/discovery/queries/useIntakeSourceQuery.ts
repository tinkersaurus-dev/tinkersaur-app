import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { intakeSourceApi } from '~/core/entities/discovery/api';

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

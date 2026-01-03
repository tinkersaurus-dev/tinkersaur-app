import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { feedbackApi } from '~/core/entities/discovery/api';

/**
 * Query hook for fetching feedbacks by team
 */
export function useFeedbacksQuery(teamId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.feedbacks.list(teamId!),
    queryFn: () => feedbackApi.list(teamId!),
    enabled: !!teamId,
    staleTime: STALE_TIMES.feedbacks,
    refetchOnWindowFocus: 'always',
  });
}

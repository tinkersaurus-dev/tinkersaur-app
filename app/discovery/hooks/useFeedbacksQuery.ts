import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES } from '@/shared/lib/query';
import { feedbackApi } from '@/entities/feedback';

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

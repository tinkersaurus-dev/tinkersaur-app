import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { feedbackPersonaApi } from '~/core/entities/discovery/api';

/**
 * Query hook for fetching feedback-persona links by feedback ID
 */
export function useFeedbackPersonasQuery(feedbackId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.feedbackPersonas.byFeedback(feedbackId!),
    queryFn: () => feedbackPersonaApi.listByFeedback(feedbackId!),
    enabled: !!feedbackId,
    staleTime: STALE_TIMES.feedbacks,
    refetchOnWindowFocus: 'always',
  });
}

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { feedbackUseCaseApi } from '~/core/entities/discovery/api';

/**
 * Query hook for fetching feedback-usecase links by feedback ID
 */
export function useFeedbackUseCasesQuery(feedbackId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.feedbackUseCases.byFeedback(feedbackId!),
    queryFn: () => feedbackUseCaseApi.listByFeedback(feedbackId!),
    enabled: !!feedbackId,
    staleTime: STALE_TIMES.feedbacks,
    refetchOnWindowFocus: 'always',
  });
}

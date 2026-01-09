import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { feedbackApi } from '~/core/entities/discovery/api';

/**
 * Query hook for fetching a feedback with its children
 */
export function useFeedbackWithChildrenQuery(feedbackId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.feedbacks.withChildren(feedbackId!),
    queryFn: () => feedbackApi.getWithChildren(feedbackId!),
    enabled: !!feedbackId,
    staleTime: STALE_TIMES.feedbacks,
    refetchOnWindowFocus: 'always',
  });
}

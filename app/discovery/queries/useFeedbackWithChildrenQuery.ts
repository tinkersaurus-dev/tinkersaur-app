import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES } from '@/shared/lib/query';
import { feedbackApi } from '@/entities/feedback';

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

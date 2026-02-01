import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES } from '@/shared/lib/query';
import { feedbackApi } from '@/entities/feedback';

/**
 * Query hook for fetching a single feedback by ID
 */
export function useFeedbackQuery(feedbackId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.feedbacks.detail(feedbackId!),
    queryFn: () => feedbackApi.get(feedbackId!),
    enabled: !!feedbackId,
    staleTime: STALE_TIMES.feedbacks,
    refetchOnWindowFocus: 'always',
  });
}

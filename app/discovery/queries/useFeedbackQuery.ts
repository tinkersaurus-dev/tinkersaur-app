import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { feedbackApi } from '~/core/entities/discovery/api';

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

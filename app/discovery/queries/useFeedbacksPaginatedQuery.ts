import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { feedbackApi } from '~/core/entities/discovery/api';
import type { FeedbackListParams } from '~/core/api/types';

/**
 * Query hook for fetching paginated feedbacks
 */
export function useFeedbacksPaginatedQuery(params: FeedbackListParams | null) {
  return useQuery({
    queryKey: params ? queryKeys.feedbacks.listPaginated(params) : ['feedbacks', 'disabled'],
    queryFn: () => feedbackApi.listPaginated(params!),
    enabled: !!params?.teamId,
    staleTime: STALE_TIMES.feedbacks,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: 'always',
  });
}

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES } from '@/shared/lib/query';
import { createPaginatedQueryHook } from '@/shared/lib/query';
import { feedbackApi } from './feedbackApi';
import type { FeedbackListParams } from '@/shared/api';

/**
 * Query hook for fetching feedbacks by team
 */
export function useFeedbacksQuery(teamId: string | undefined, solutionId?: string) {
  return useQuery({
    queryKey: queryKeys.feedbacks.list(teamId!, solutionId),
    queryFn: () => feedbackApi.listByTeam(teamId!, solutionId),
    enabled: !!teamId,
    staleTime: STALE_TIMES.feedbacks,
    refetchOnWindowFocus: 'always',
  });
}

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

/**
 * Query hook for fetching paginated feedbacks
 */
export const useFeedbacksPaginatedQuery = createPaginatedQueryHook({
  entityName: 'feedbacks',
  getQueryKey: (params: FeedbackListParams) => queryKeys.feedbacks.listPaginated(params),
  queryFn: (params: FeedbackListParams) => feedbackApi.listPaginated(params),
  staleTimeKey: 'feedbacks',
});

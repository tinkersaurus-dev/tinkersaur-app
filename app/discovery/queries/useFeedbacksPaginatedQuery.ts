import { queryKeys } from '@/shared/lib/query';
import { createPaginatedQueryHook } from '@/shared/lib/query';
import { feedbackApi } from '@/entities/feedback';
import type { FeedbackListParams } from '@/shared/api';

/**
 * Query hook for fetching paginated feedbacks
 */
export const useFeedbacksPaginatedQuery = createPaginatedQueryHook({
  entityName: 'feedbacks',
  getQueryKey: (params: FeedbackListParams) => queryKeys.feedbacks.listPaginated(params),
  queryFn: (params: FeedbackListParams) => feedbackApi.listPaginated(params),
  staleTimeKey: 'feedbacks',
});

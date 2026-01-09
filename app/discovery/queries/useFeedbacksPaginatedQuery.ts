import { queryKeys } from '~/core/query/queryKeys';
import { createPaginatedQueryHook } from '~/core/query/createPaginatedQueryHook';
import { feedbackApi } from '~/core/entities/discovery/api';
import type { FeedbackListParams } from '~/core/api/types';

/**
 * Query hook for fetching paginated feedbacks
 */
export const useFeedbacksPaginatedQuery = createPaginatedQueryHook({
  entityName: 'feedbacks',
  getQueryKey: (params: FeedbackListParams) => queryKeys.feedbacks.listPaginated(params),
  queryFn: (params: FeedbackListParams) => feedbackApi.listPaginated(params),
  staleTimeKey: 'feedbacks',
});

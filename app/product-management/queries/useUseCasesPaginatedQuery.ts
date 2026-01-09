import { queryKeys } from '~/core/query/queryKeys';
import { createPaginatedQueryHook } from '~/core/query/createPaginatedQueryHook';
import { useCaseApi } from '~/core/entities/product-management/api';
import type { UseCaseListParams } from '~/core/api/types';

/**
 * Query hook for fetching paginated use cases
 */
export const useUseCasesPaginatedQuery = createPaginatedQueryHook({
  entityName: 'useCases',
  getQueryKey: (params: UseCaseListParams) => queryKeys.useCases.listPaginated(params),
  queryFn: (params: UseCaseListParams) => useCaseApi.listPaginated(params),
  staleTimeKey: 'useCases',
});

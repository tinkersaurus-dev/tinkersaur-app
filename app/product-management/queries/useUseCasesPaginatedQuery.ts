import { queryKeys } from '@/shared/lib/query';
import { createPaginatedQueryHook } from '@/shared/lib/query';
import { useCaseApi } from '@/entities/use-case';
import type { UseCaseListParams } from '@/shared/api';

/**
 * Query hook for fetching paginated use cases
 */
export const useUseCasesPaginatedQuery = createPaginatedQueryHook({
  entityName: 'useCases',
  getQueryKey: (params: UseCaseListParams) => queryKeys.useCases.listPaginated(params),
  queryFn: (params: UseCaseListParams) => useCaseApi.listPaginated(params),
  staleTimeKey: 'useCases',
});

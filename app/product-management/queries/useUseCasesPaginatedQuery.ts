import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { useCaseApi } from '~/core/entities/product-management/api';
import type { UseCaseListParams } from '~/core/api/types';

/**
 * Query hook for fetching paginated use cases
 */
export function useUseCasesPaginatedQuery(params: UseCaseListParams | null) {
  return useQuery({
    queryKey: params ? queryKeys.useCases.listPaginated(params) : ['useCases', 'disabled'],
    queryFn: () => useCaseApi.listPaginated(params!),
    enabled: !!params?.teamId,
    staleTime: STALE_TIMES.useCases,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: 'always',
  });
}

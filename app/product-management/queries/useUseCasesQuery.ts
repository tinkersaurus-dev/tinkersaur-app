import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { useCaseApi } from '~/core/entities/product-management/api';

/**
 * Query hook for fetching use cases by solution
 */
export function useUseCasesQuery(solutionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.useCases.list(solutionId!),
    queryFn: () => useCaseApi.list(solutionId!),
    enabled: !!solutionId,
    staleTime: STALE_TIMES.useCases,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Query hook for fetching a single use case
 */
export function useUseCaseQuery(useCaseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.useCases.detail(useCaseId!),
    queryFn: () => useCaseApi.get(useCaseId!),
    enabled: !!useCaseId,
    staleTime: STALE_TIMES.useCases,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Prefetch use cases for SSR
 */
export function prefetchUseCases(solutionId: string) {
  return {
    queryKey: queryKeys.useCases.list(solutionId),
    queryFn: () => useCaseApi.list(solutionId),
    staleTime: STALE_TIMES.useCases,
  };
}

/**
 * Prefetch a single use case for SSR
 */
export function prefetchUseCase(useCaseId: string) {
  return {
    queryKey: queryKeys.useCases.detail(useCaseId),
    queryFn: () => useCaseApi.get(useCaseId),
    staleTime: STALE_TIMES.useCases,
  };
}

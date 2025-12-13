import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES, REFETCH_INTERVALS } from '~/core/query/queryClient';
import { designWorkApi, type DesignWorksWithReferences } from '~/core/entities/design-studio/api';

/**
 * Query hook for fetching design works by solution with content metadata.
 * Returns both design works and full reference objects.
 */
export function useDesignWorksWithContentQuery(solutionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.designWorks.list(solutionId!),
    queryFn: () => designWorkApi.listWithContent(solutionId!),
    enabled: !!solutionId,
    staleTime: STALE_TIMES.designWorks,
    refetchInterval: REFETCH_INTERVALS.designWorks,
    refetchOnWindowFocus: 'always',
    select: (data: DesignWorksWithReferences) => data,
  });
}

/**
 * Query hook for fetching design works by solution (backwards compatible).
 * Note: This internally uses listWithContent but only returns design works.
 */
export function useDesignWorksQuery(solutionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.designWorks.list(solutionId!),
    queryFn: () => designWorkApi.listWithContent(solutionId!),
    enabled: !!solutionId,
    staleTime: STALE_TIMES.designWorks,
    refetchInterval: REFETCH_INTERVALS.designWorks,
    refetchOnWindowFocus: 'always',
    select: (data: DesignWorksWithReferences) => data.designWorks,
  });
}

/**
 * Query hook for fetching a single design work
 */
export function useDesignWorkQuery(designWorkId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.designWorks.detail(designWorkId!),
    queryFn: () => designWorkApi.get(designWorkId!),
    enabled: !!designWorkId,
    staleTime: STALE_TIMES.designWorks,
    refetchInterval: REFETCH_INTERVALS.designWorks,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Prefetch design works for SSR
 */
export function prefetchDesignWorks(solutionId: string) {
  return {
    queryKey: queryKeys.designWorks.list(solutionId),
    queryFn: () => designWorkApi.listWithContent(solutionId),
    staleTime: STALE_TIMES.designWorks,
  };
}

/**
 * Prefetch a single design work for SSR
 */
export function prefetchDesignWork(designWorkId: string) {
  return {
    queryKey: queryKeys.designWorks.detail(designWorkId),
    queryFn: () => designWorkApi.get(designWorkId),
    staleTime: STALE_TIMES.designWorks,
  };
}

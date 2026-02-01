/**
 * TanStack Query hooks for Diagram entity
 * @module entities/diagram/api/queries
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES, REFETCH_INTERVALS } from '@/shared/lib/query';
import { diagramApi } from './diagramApi';

/**
 * Query hook for fetching diagrams by design work
 */
export function useDiagramsQuery(designWorkId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.diagrams.list(designWorkId!),
    queryFn: () => diagramApi.list(designWorkId!),
    enabled: !!designWorkId,
    staleTime: STALE_TIMES.diagrams,
    refetchInterval: REFETCH_INTERVALS.diagrams,
  });
}

/**
 * Query hook for fetching a single diagram
 */
export function useDiagramQuery(diagramId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.diagrams.detail(diagramId!),
    queryFn: () => diagramApi.get(diagramId!),
    enabled: !!diagramId,
    staleTime: STALE_TIMES.diagrams,
    refetchInterval: REFETCH_INTERVALS.diagrams,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Prefetch diagrams for SSR
 */
export function prefetchDiagrams(designWorkId: string) {
  return {
    queryKey: queryKeys.diagrams.list(designWorkId),
    queryFn: () => diagramApi.list(designWorkId),
    staleTime: STALE_TIMES.diagrams,
  };
}

/**
 * Prefetch a single diagram for SSR
 */
export function prefetchDiagram(diagramId: string) {
  return {
    queryKey: queryKeys.diagrams.detail(diagramId),
    queryFn: () => diagramApi.get(diagramId),
    staleTime: STALE_TIMES.diagrams,
  };
}

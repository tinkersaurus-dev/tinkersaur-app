/**
 * TanStack Query hooks for Reference entity
 * @module entities/reference/api/queries
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES } from '@/shared/lib/query';
import { referenceApi } from './referenceApi';

/**
 * Query hook for fetching references by design work
 */
export function useReferencesQuery(designWorkId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.references.list(designWorkId!),
    queryFn: () => referenceApi.list(designWorkId!),
    enabled: !!designWorkId,
    staleTime: STALE_TIMES.references,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Query hook for fetching a single reference
 */
export function useReferenceQuery(referenceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.references.detail(referenceId!),
    queryFn: () => referenceApi.get(referenceId!),
    enabled: !!referenceId,
    staleTime: STALE_TIMES.references,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Prefetch references for SSR
 */
export function prefetchReferences(designWorkId: string) {
  return {
    queryKey: queryKeys.references.list(designWorkId),
    queryFn: () => referenceApi.list(designWorkId),
    staleTime: STALE_TIMES.references,
  };
}

/**
 * Prefetch a single reference for SSR
 */
export function prefetchReference(referenceId: string) {
  return {
    queryKey: queryKeys.references.detail(referenceId),
    queryFn: () => referenceApi.get(referenceId),
    staleTime: STALE_TIMES.references,
  };
}

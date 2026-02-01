/**
 * TanStack Query hooks for Interface entity
 * @module entities/interface/api/queries
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES, REFETCH_INTERVALS } from '@/shared/lib/query';
import { interfaceApi } from './interfaceApi';

/**
 * Query hook for fetching interfaces by design work
 */
export function useInterfacesQuery(designWorkId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.interfaces.list(designWorkId!),
    queryFn: () => interfaceApi.list(designWorkId!),
    enabled: !!designWorkId,
    staleTime: STALE_TIMES.interfaces,
    refetchInterval: REFETCH_INTERVALS.interfaces,
  });
}

/**
 * Query hook for fetching a single interface
 */
export function useInterfaceQuery(interfaceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.interfaces.detail(interfaceId!),
    queryFn: () => interfaceApi.get(interfaceId!),
    enabled: !!interfaceId,
    staleTime: STALE_TIMES.interfaces,
    refetchInterval: REFETCH_INTERVALS.interfaces,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Prefetch interfaces for SSR
 */
export function prefetchInterfaces(designWorkId: string) {
  return {
    queryKey: queryKeys.interfaces.list(designWorkId),
    queryFn: () => interfaceApi.list(designWorkId),
    staleTime: STALE_TIMES.interfaces,
  };
}

/**
 * Prefetch a single interface for SSR
 */
export function prefetchInterface(interfaceId: string) {
  return {
    queryKey: queryKeys.interfaces.detail(interfaceId),
    queryFn: () => interfaceApi.get(interfaceId),
    staleTime: STALE_TIMES.interfaces,
  };
}

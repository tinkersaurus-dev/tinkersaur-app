import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { organizationApi } from '~/core/entities/product-management/api';

/**
 * Query hook for fetching all organizations
 */
export function useOrganizationsQuery() {
  return useQuery({
    queryKey: queryKeys.organizations.list(),
    queryFn: () => organizationApi.list(),
    staleTime: STALE_TIMES.organizations,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Query hook for fetching a single organization
 */
export function useOrganizationQuery(organizationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.organizations.detail(organizationId!),
    queryFn: () => organizationApi.get(organizationId!),
    enabled: !!organizationId,
    staleTime: STALE_TIMES.organizations,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Prefetch organizations for SSR
 */
export function prefetchOrganizations() {
  return {
    queryKey: queryKeys.organizations.list(),
    queryFn: () => organizationApi.list(),
    staleTime: STALE_TIMES.organizations,
  };
}

/**
 * Prefetch a single organization for SSR
 */
export function prefetchOrganization(organizationId: string) {
  return {
    queryKey: queryKeys.organizations.detail(organizationId),
    queryFn: () => organizationApi.get(organizationId),
    staleTime: STALE_TIMES.organizations,
  };
}

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES } from '@/shared/lib/query';
import { userApi } from './userApi';

/**
 * Query hook for fetching users by team
 */
export function useUsersQuery(teamId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.users.list(teamId!),
    queryFn: () => userApi.list(teamId!),
    enabled: !!teamId,
    staleTime: STALE_TIMES.users,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Query hook for fetching a single user
 */
export function useUserQuery(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId!),
    queryFn: () => userApi.get(userId!),
    enabled: !!userId,
    staleTime: STALE_TIMES.users,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Prefetch users for SSR
 */
export function prefetchUsers(teamId: string) {
  return {
    queryKey: queryKeys.users.list(teamId),
    queryFn: () => userApi.list(teamId),
    staleTime: STALE_TIMES.users,
  };
}

/**
 * Prefetch a single user for SSR
 */
export function prefetchUser(userId: string) {
  return {
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => userApi.get(userId),
    staleTime: STALE_TIMES.users,
  };
}

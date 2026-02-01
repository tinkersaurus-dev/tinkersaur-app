import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES } from '@/shared/lib/query';
import { teamApi } from '@/entities/team';

/**
 * Query hook for fetching teams by organization
 */
export function useTeamsQuery(organizationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.teams.list(organizationId!),
    queryFn: () => teamApi.list(organizationId!),
    enabled: !!organizationId,
    staleTime: STALE_TIMES.teams,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Query hook for fetching a single team
 */
export function useTeamQuery(teamId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.teams.detail(teamId!),
    queryFn: () => teamApi.get(teamId!),
    enabled: !!teamId,
    staleTime: STALE_TIMES.teams,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Prefetch teams for SSR
 */
export function prefetchTeams(organizationId: string) {
  return {
    queryKey: queryKeys.teams.list(organizationId),
    queryFn: () => teamApi.list(organizationId),
    staleTime: STALE_TIMES.teams,
  };
}

/**
 * Prefetch a single team for SSR
 */
export function prefetchTeam(teamId: string) {
  return {
    queryKey: queryKeys.teams.detail(teamId),
    queryFn: () => teamApi.get(teamId),
    staleTime: STALE_TIMES.teams,
  };
}

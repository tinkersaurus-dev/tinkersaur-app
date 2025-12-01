/**
 * Teams hooks - Data access for teams
 */

import { useEffect } from 'react';
import { useTeamStore } from '~/core/entities/product-management';

/**
 * Hook to fetch and access all teams for an organization
 */
export function useTeams(organizationId: string) {
  const teams = useTeamStore((state) => state.entities);
  const loading = useTeamStore((state) => state.loading);
  const error = useTeamStore((state) => state.error);
  const fetchTeams = useTeamStore((state) => state.fetchTeams);

  useEffect(() => {
    fetchTeams(organizationId);
  }, [organizationId, fetchTeams]);

  return { teams, loading, error };
}

/**
 * Hook to access a single team by ID
 */
export function useTeam(teamId: string | undefined) {
  const team = useTeamStore((state) =>
    teamId ? state.entities.find((t) => t.id === teamId) : undefined
  );
  const loading = useTeamStore((state) => state.loading);
  const error = useTeamStore((state) => state.error);

  return { team, loading, error };
}

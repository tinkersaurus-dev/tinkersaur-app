/**
 * Solutions hooks - Data access for solutions
 */

import { useEffect } from 'react';
import { useSolutionStore } from '~/core/entities/product-management';

/**
 * Hook to fetch and access all solutions for a team
 */
export function useSolutions(teamId: string) {
  const solutions = useSolutionStore((state) => state.entities);
  const loading = useSolutionStore((state) => state.loading);
  const error = useSolutionStore((state) => state.error);
  const fetchSolutions = useSolutionStore((state) => state.fetchSolutions);

  useEffect(() => {
    fetchSolutions(teamId);
  }, [teamId, fetchSolutions]);

  return { solutions, loading, error };
}

/**
 * Hook to access a single solution by ID
 */
export function useSolution(solutionId: string | undefined) {
  const solution = useSolutionStore((state) =>
    solutionId ? state.entities.find((s) => s.id === solutionId) : undefined
  );
  const loading = useSolutionStore((state) => state.loading);
  const error = useSolutionStore((state) => state.error);

  return { solution, loading, error };
}

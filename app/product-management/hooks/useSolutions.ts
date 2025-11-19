/**
 * Solutions hooks - Data access for solutions
 */

import { useEffect } from 'react';
import { useSolutionManagementEntityStore } from '~/core/entities/product-management';

/**
 * Hook to fetch and access all solutions for an organization
 */
export function useSolutions(organizationId: string) {
  const solutions = useSolutionManagementEntityStore((state) => state.solutions);
  const loading = useSolutionManagementEntityStore((state) => state.loading.solutions);
  const error = useSolutionManagementEntityStore((state) => state.errors.solutions);
  const fetchSolutions = useSolutionManagementEntityStore((state) => state.fetchSolutions);

  useEffect(() => {
    fetchSolutions(organizationId);
  }, [organizationId, fetchSolutions]);

  return { solutions, loading, error };
}

/**
 * Hook to access a single solution by ID
 */
export function useSolution(solutionId: string | undefined) {
  const solution = useSolutionManagementEntityStore((state) =>
    solutionId ? state.solutions.find((s) => s.id === solutionId) : undefined
  );
  const loading = useSolutionManagementEntityStore((state) => state.loading.solutions);
  const error = useSolutionManagementEntityStore((state) => state.errors.solutions);

  return { solution, loading, error };
}

/**
 * Use Cases hooks - Data access for use cases
 */

import { useEffect, useMemo } from 'react';
import { useUseCaseStore } from '~/core/entities/product-management/store/useCase/useUseCaseStore';

/**
 * Hook to fetch and access use cases for a solution
 */
export function useUseCases(solutionId: string | undefined) {
  const allUseCases = useUseCaseStore((state) => state.entities);
  const loading = useUseCaseStore((state) => state.loading);
  const error = useUseCaseStore((state) => state.error);
  const fetchUseCasesBySolution = useUseCaseStore(
    (state) => state.fetchUseCasesBySolution
  );

  // Memoize the filtered use cases to prevent infinite loops
  const useCases = useMemo(
    () => (solutionId ? allUseCases.filter((u) => u.solutionId === solutionId) : []),
    [allUseCases, solutionId]
  );

  useEffect(() => {
    if (solutionId) {
      fetchUseCasesBySolution(solutionId);
    }
  }, [solutionId, fetchUseCasesBySolution]);

  return { useCases, loading, error };
}

/**
 * Hook to access a single use case by ID
 */
export function useUseCase(useCaseId: string | undefined) {
  const useCase = useUseCaseStore((state) =>
    useCaseId ? state.entities.find((u) => u.id === useCaseId) : undefined
  );
  const loading = useUseCaseStore((state) => state.loading);
  const error = useUseCaseStore((state) => state.error);

  return { useCase, loading, error };
}

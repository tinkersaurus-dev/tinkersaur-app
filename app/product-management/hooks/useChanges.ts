/**
 * Changes hooks - Data access for changes
 */

import { useEffect, useMemo } from 'react';
import { useChangeStore } from '~/core/entities/product-management/store/change/useChangeStore';

/**
 * Hook to fetch and access changes for a use case
 */
export function useChanges(useCaseId: string | undefined) {
  const allChanges = useChangeStore((state) => state.entities);
  const loading = useChangeStore((state) => state.loading);
  const error = useChangeStore((state) => state.error);
  const fetchChangesByUseCase = useChangeStore(
    (state) => state.fetchChangesByUseCase
  );

  // Memoize the filtered changes to prevent infinite loops
  const changes = useMemo(
    () => (useCaseId ? allChanges.filter((c) => c.useCaseId === useCaseId) : []),
    [allChanges, useCaseId]
  );

  useEffect(() => {
    if (useCaseId) {
      fetchChangesByUseCase(useCaseId);
    }
  }, [useCaseId, fetchChangesByUseCase]);

  return { changes, loading, error };
}

/**
 * Hook to access a single change by ID
 */
export function useChange(changeId: string | undefined) {
  const change = useChangeStore((state) =>
    changeId ? state.entities.find((c) => c.id === changeId) : undefined
  );
  const loading = useChangeStore((state) => state.loading);
  const error = useChangeStore((state) => state.error);

  return { change, loading, error };
}

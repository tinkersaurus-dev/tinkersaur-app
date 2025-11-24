/**
 * Changes hooks - Data access for changes
 */

import { useEffect, useMemo } from 'react';
import { useChangeStore } from '~/core/entities/product-management/store/change/useChangeStore';

/**
 * Hook to fetch and access changes for a feature
 */
export function useChanges(featureId: string | undefined) {
  const allChanges = useChangeStore((state) => state.entities);
  const loading = useChangeStore((state) => state.loading);
  const error = useChangeStore((state) => state.error);
  const fetchChangesByFeature = useChangeStore(
    (state) => state.fetchChangesByFeature
  );

  // Memoize the filtered changes to prevent infinite loops
  const changes = useMemo(
    () => (featureId ? allChanges.filter((c) => c.featureId === featureId) : []),
    [allChanges, featureId]
  );

  useEffect(() => {
    if (featureId) {
      fetchChangesByFeature(featureId);
    }
  }, [featureId, fetchChangesByFeature]);

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

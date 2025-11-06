/**
 * Changes hooks - Data access for changes
 */

import { useEffect, useMemo } from 'react';
import { useSolutionManagementEntityStore } from '~/core/entities/product-management';

/**
 * Hook to fetch and access changes for a feature
 */
export function useChanges(featureId: string | undefined) {
  const allChanges = useSolutionManagementEntityStore((state) => state.changes);
  const loading = useSolutionManagementEntityStore((state) => state.loading.changes);
  const error = useSolutionManagementEntityStore((state) => state.errors.changes);
  const fetchChangesByFeature = useSolutionManagementEntityStore(
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureId]); // Only re-fetch when featureId changes

  return { changes, loading, error };
}

/**
 * Hook to access a single change by ID
 */
export function useChange(changeId: string | undefined) {
  const change = useSolutionManagementEntityStore((state) =>
    changeId ? state.changes.find((c) => c.id === changeId) : undefined
  );
  const loading = useSolutionManagementEntityStore((state) => state.loading.changes);
  const error = useSolutionManagementEntityStore((state) => state.errors.changes);

  return { change, loading, error };
}

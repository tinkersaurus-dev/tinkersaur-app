/**
 * Features hooks - Data access for features
 */

import { useEffect, useMemo } from 'react';
import { useSolutionManagementEntityStore } from '~/core/entities/product-management';

/**
 * Hook to fetch and access features for a solution
 */
export function useFeatures(solutionId: string | undefined) {
  const allFeatures = useSolutionManagementEntityStore((state) => state.features);
  const loading = useSolutionManagementEntityStore((state) => state.loading.features);
  const error = useSolutionManagementEntityStore((state) => state.errors.features);
  const fetchFeaturesBySolution = useSolutionManagementEntityStore(
    (state) => state.fetchFeaturesBySolution
  );

  // Memoize the filtered features to prevent infinite loops
  const features = useMemo(
    () => (solutionId ? allFeatures.filter((f) => f.solutionId === solutionId) : []),
    [allFeatures, solutionId]
  );

  useEffect(() => {
    if (solutionId) {
      fetchFeaturesBySolution(solutionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solutionId]); // Only re-fetch when solutionId changes

  return { features, loading, error };
}

/**
 * Hook to access a single feature by ID
 */
export function useFeature(featureId: string | undefined) {
  const feature = useSolutionManagementEntityStore((state) =>
    featureId ? state.features.find((f) => f.id === featureId) : undefined
  );
  const loading = useSolutionManagementEntityStore((state) => state.loading.features);
  const error = useSolutionManagementEntityStore((state) => state.errors.features);

  return { feature, loading, error };
}

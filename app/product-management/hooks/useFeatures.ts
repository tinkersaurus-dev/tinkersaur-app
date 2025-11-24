/**
 * Features hooks - Data access for features
 */

import { useEffect, useMemo } from 'react';
import { useFeatureStore } from '~/core/entities/product-management/store/feature/useFeatureStore';

/**
 * Hook to fetch and access features for a solution
 */
export function useFeatures(solutionId: string | undefined) {
  const allFeatures = useFeatureStore((state) => state.entities);
  const loading = useFeatureStore((state) => state.loading);
  const error = useFeatureStore((state) => state.error);
  const fetchFeaturesBySolution = useFeatureStore(
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
  }, [solutionId, fetchFeaturesBySolution]);

  return { features, loading, error };
}

/**
 * Hook to access a single feature by ID
 */
export function useFeature(featureId: string | undefined) {
  const feature = useFeatureStore((state) =>
    featureId ? state.entities.find((f) => f.id === featureId) : undefined
  );
  const loading = useFeatureStore((state) => state.loading);
  const error = useFeatureStore((state) => state.error);

  return { feature, loading, error };
}

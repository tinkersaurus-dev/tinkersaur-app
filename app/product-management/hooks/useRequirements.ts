/**
 * Requirements hooks - Data access for requirements
 */

import { useEffect, useMemo } from 'react';
import { useSolutionManagementEntityStore } from '~/core/entities/product-management';

/**
 * Hook to fetch and access requirements for a change
 */
export function useRequirements(changeId: string | undefined) {
  const allRequirements = useSolutionManagementEntityStore((state) => state.requirements);
  const loading = useSolutionManagementEntityStore((state) => state.loading.requirements);
  const error = useSolutionManagementEntityStore((state) => state.errors.requirements);
  const fetchRequirementsByChange = useSolutionManagementEntityStore(
    (state) => state.fetchRequirementsByChange
  );

  // Memoize the filtered requirements to prevent infinite loops
  const requirements = useMemo(
    () => (changeId ? allRequirements.filter((r) => r.changeId === changeId) : []),
    [allRequirements, changeId]
  );

  useEffect(() => {
    if (changeId) {
      fetchRequirementsByChange(changeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changeId]); // Only re-fetch when changeId changes

  return { requirements, loading, error };
}

/**
 * Hook to access a single requirement by ID
 */
export function useRequirement(requirementId: string | undefined) {
  const requirement = useSolutionManagementEntityStore((state) =>
    requirementId ? state.requirements.find((r) => r.id === requirementId) : undefined
  );
  const loading = useSolutionManagementEntityStore((state) => state.loading.requirements);
  const error = useSolutionManagementEntityStore((state) => state.errors.requirements);

  return { requirement, loading, error };
}

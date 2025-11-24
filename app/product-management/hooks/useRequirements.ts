/**
 * Requirements hooks - Data access for requirements
 */

import { useEffect, useMemo } from 'react';
import { useRequirementStore } from '~/core/entities/product-management/store/requirement/useRequirementStore';

/**
 * Hook to fetch and access requirements for a change
 */
export function useRequirements(changeId: string | undefined) {
  const allRequirements = useRequirementStore((state) => state.entities);
  const loading = useRequirementStore((state) => state.loading);
  const error = useRequirementStore((state) => state.error);
  const fetchRequirementsByChange = useRequirementStore(
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
  }, [changeId, fetchRequirementsByChange]);

  return { requirements, loading, error };
}

/**
 * Hook to access a single requirement by ID
 */
export function useRequirement(requirementId: string | undefined) {
  const requirement = useRequirementStore((state) =>
    requirementId ? state.entities.find((r) => r.id === requirementId) : undefined
  );
  const loading = useRequirementStore((state) => state.loading);
  const error = useRequirementStore((state) => state.error);

  return { requirement, loading, error };
}

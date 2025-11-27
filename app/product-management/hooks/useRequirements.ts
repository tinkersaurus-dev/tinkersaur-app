/**
 * Requirements hooks - Data access for requirements
 */

import { useEffect, useMemo } from 'react';
import { useRequirementStore } from '~/core/entities/product-management/store/requirement/useRequirementStore';

/**
 * Hook to fetch and access requirements for a use case
 */
export function useRequirements(useCaseId: string | undefined) {
  const allRequirements = useRequirementStore((state) => state.entities);
  const loading = useRequirementStore((state) => state.loading);
  const error = useRequirementStore((state) => state.error);
  const fetchRequirementsByUseCase = useRequirementStore(
    (state) => state.fetchRequirementsByUseCase
  );

  // Memoize the filtered requirements to prevent infinite loops
  const requirements = useMemo(
    () => (useCaseId ? allRequirements.filter((r) => r.useCaseId === useCaseId) : []),
    [allRequirements, useCaseId]
  );

  useEffect(() => {
    if (useCaseId) {
      fetchRequirementsByUseCase(useCaseId);
    }
  }, [useCaseId, fetchRequirementsByUseCase]);

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

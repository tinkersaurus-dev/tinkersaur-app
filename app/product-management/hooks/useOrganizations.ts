/**
 * Organizations hooks - Data access for organizations
 */

import { useEffect } from 'react';
import { useOrganizationStore } from '~/core/entities/product-management';

/**
 * Hook to fetch and access all organizations
 */
export function useOrganizations() {
  const organizations = useOrganizationStore((state) => state.entities);
  const loading = useOrganizationStore((state) => state.loading);
  const error = useOrganizationStore((state) => state.error);
  const fetchOrganizations = useOrganizationStore((state) => state.fetchOrganizations);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  return { organizations, loading, error };
}

/**
 * Hook to access a single organization by ID
 */
export function useOrganization(organizationId: string | undefined) {
  const organization = useOrganizationStore((state) =>
    organizationId ? state.entities.find((o) => o.id === organizationId) : undefined
  );
  const loading = useOrganizationStore((state) => state.loading);
  const error = useOrganizationStore((state) => state.error);

  return { organization, loading, error };
}

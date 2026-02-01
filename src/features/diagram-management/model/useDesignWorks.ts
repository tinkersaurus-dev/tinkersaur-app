import { useEffect, useMemo } from 'react';
import { useDesignWorkStore } from '@/entities/design-work/store/useDesignWorkStore';
import { useReferenceStore } from '@/entities/reference/store/useReferenceStore';
import { useDesignWorksWithContentQuery } from '@/entities/design-work/api/queries';

/**
 * Hook to fetch and access all design works for a solution
 * Uses TanStack Query for data fetching with automatic caching and background refresh.
 * Also syncs references to the reference store for enriching tree nodes.
 */
export function useDesignWorks(solutionId: string) {
  const setDesignWorks = useDesignWorkStore((state) => state.setDesignWorks);
  const storedDesignWorks = useDesignWorkStore((state) => state.designWorks);
  const error = useDesignWorkStore((state) => state.error);
  const setReferences = useReferenceStore((state) => state.setReferences);

  // Use TanStack Query for fetching - returns both design works and references
  const { data, isLoading } = useDesignWorksWithContentQuery(solutionId);

  // Sync fetched design works and references to Zustand stores
  useEffect(() => {
    if (data) {
      setDesignWorks(data.designWorks);
      setReferences(data.references);
    }
  }, [data, setDesignWorks, setReferences]);

  // Filter to only this solution's design works - use store for immediate updates
  const filteredDesignWorks = useMemo(
    () => (storedDesignWorks.length > 0 ? storedDesignWorks : data?.designWorks ?? []).filter((dw) => dw.solutionId === solutionId),
    [storedDesignWorks, data?.designWorks, solutionId]
  );

  return { designWorks: filteredDesignWorks, loading: isLoading, error };
}

/**
 * Hook to get child design works (nested folders)
 */
export function useChildDesignWorks(parentDesignWorkId: string | undefined) {
  const designWorks = useDesignWorkStore((state) => state.designWorks);

  const childDesignWorks = useMemo(
    () => (parentDesignWorkId ? designWorks.filter((dw) => dw.parentDesignWorkId === parentDesignWorkId) : []),
    [designWorks, parentDesignWorkId]
  );

  return childDesignWorks;
}

/**
 * Hook to get root design works (top-level folders)
 */
export function useRootDesignWorks(solutionId: string) {
  const designWorks = useDesignWorkStore((state) => state.designWorks);

  const rootDesignWorks = useMemo(
    () => designWorks.filter((dw) => dw.solutionId === solutionId && !dw.parentDesignWorkId),
    [designWorks, solutionId]
  );

  return rootDesignWorks;
}

/**
 * Hook to get a single design work by ID
 */
export function useDesignWork(id: string | undefined) {
  const designWorks = useDesignWorkStore((state) => state.designWorks);

  const designWork = useMemo(() => (id ? designWorks.find((dw) => dw.id === id) : undefined), [designWorks, id]);

  return designWork;
}

import { useEffect, useMemo } from 'react';
import { useDesignStudioEntityStore } from '~/core/entities/design-studio';

/**
 * Hook to fetch and access all design works for a solution
 */
export function useDesignWorks(solutionId: string) {
  const designWorks = useDesignStudioEntityStore((state) => state.designWorks);
  const loading = useDesignStudioEntityStore((state) => state.loading.designWorks);
  const error = useDesignStudioEntityStore((state) => state.errors.designWorks);
  const fetchDesignWorks = useDesignStudioEntityStore((state) => state.fetchDesignWorks);

  useEffect(() => {
    fetchDesignWorks(solutionId);
  }, [solutionId, fetchDesignWorks]);

  // Filter to only this solution's design works
  const filteredDesignWorks = useMemo(
    () => designWorks.filter((dw) => dw.solutionId === solutionId),
    [designWorks, solutionId]
  );

  return { designWorks: filteredDesignWorks, loading, error };
}

/**
 * Hook to get child design works (nested folders)
 */
export function useChildDesignWorks(parentDesignWorkId: string | undefined) {
  const designWorks = useDesignStudioEntityStore((state) => state.designWorks);

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
  const designWorks = useDesignStudioEntityStore((state) => state.designWorks);

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
  const designWorks = useDesignStudioEntityStore((state) => state.designWorks);

  const designWork = useMemo(() => (id ? designWorks.find((dw) => dw.id === id) : undefined), [designWorks, id]);

  return designWork;
}

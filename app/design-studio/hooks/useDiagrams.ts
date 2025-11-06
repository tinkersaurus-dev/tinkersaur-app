import { useEffect, useMemo } from 'react';
import { useDesignStudioEntityStore } from '~/core/entities/design-studio';

/**
 * Hook to fetch and access all diagrams for a solution
 */
export function useDiagrams(solutionId: string) {
  const diagrams = useDesignStudioEntityStore((state) => state.diagrams);
  const loading = useDesignStudioEntityStore((state) => state.loading.diagrams);
  const error = useDesignStudioEntityStore((state) => state.errors.diagrams);
  const fetchDiagrams = useDesignStudioEntityStore((state) => state.fetchDiagrams);

  useEffect(() => {
    fetchDiagrams(solutionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solutionId]); // Only re-fetch when solutionId changes

  return { diagrams, loading, error };
}

/**
 * Hook to get diagrams for a specific design work
 */
export function useDiagramsByDesignWork(designWorkId: string | undefined) {
  const diagrams = useDesignStudioEntityStore((state) => state.diagrams);

  const filteredDiagrams = useMemo(
    () => (designWorkId ? diagrams.filter((d) => d.designWorkId === designWorkId) : []),
    [diagrams, designWorkId]
  );

  return filteredDiagrams;
}

/**
 * Hook to get a single diagram by ID
 */
export function useDiagram(id: string | undefined) {
  const diagrams = useDesignStudioEntityStore((state) => state.diagrams);

  const diagram = useMemo(() => (id ? diagrams.find((d) => d.id === id) : undefined), [diagrams, id]);

  return diagram;
}

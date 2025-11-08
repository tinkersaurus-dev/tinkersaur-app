import { useEffect } from 'react';
import { useDesignStudioEntityStore } from '~/core/entities/design-studio';

/**
 * Hook to lazy load and access a single diagram by ID
 *
 * This hook provides access to the complete diagram including its shapes and connectors.
 * For CRUD operations on diagrams and shapes, use useDiagramCRUD.
 *
 * NOTE: Viewport state (zoom, pan) is NOT part of the diagram entity - it's ephemeral
 * canvas UI state managed by the canvas instance store.
 */
export function useDiagram(id: string | undefined) {
  const diagram = useDesignStudioEntityStore((state) => (id ? state.diagrams[id] : undefined));
  const loading = useDesignStudioEntityStore((state) => (id ? state.loading.diagrams[id] : false));
  const error = useDesignStudioEntityStore((state) => (id ? state.errors.diagrams[id] : null));
  const fetchDiagram = useDesignStudioEntityStore((state) => state.fetchDiagram);

  useEffect(() => {
    if (id && !diagram && !loading) {
      fetchDiagram(id);
    }
  }, [id, diagram, loading, fetchDiagram]);

  return {
    diagram,
    loading,
    error,
  };
}

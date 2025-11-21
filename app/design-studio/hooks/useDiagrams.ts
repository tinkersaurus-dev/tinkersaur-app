import { useEffect } from 'react';
import { useDiagramStore } from '~/core/entities/design-studio';

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
  const diagram = useDiagramStore((state) => (id ? state.diagrams[id] : undefined));
  const loading = useDiagramStore((state) => (id ? state.loading[id] : false));
  const error = useDiagramStore((state) => (id ? state.errors[id] : null));
  const fetchDiagram = useDiagramStore((state) => state.fetchDiagram);

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

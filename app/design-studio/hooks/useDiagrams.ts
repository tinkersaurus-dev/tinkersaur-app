import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDiagramStore } from '~/core/entities/design-studio';
import { useDiagramQuery } from '~/design-studio/queries';
import { queryKeys } from '~/core/query/queryKeys';

/**
 * Hook to lazy load and access a single diagram by ID
 *
 * This hook provides access to the complete diagram including its shapes and connectors.
 * Uses TanStack Query for data fetching with automatic caching and background refresh.
 * For CRUD operations on diagrams and shapes, use useDiagramCRUD.
 *
 * NOTE: Viewport state (zoom, pan) is NOT part of the diagram entity - it's ephemeral
 * canvas UI state managed by the canvas instance store.
 */
export function useDiagram(id: string | undefined) {
  const queryClient = useQueryClient();
  const setDiagram = useDiagramStore((state) => state.setDiagram);
  const clearDiagram = useDiagramStore((state) => state.clearDiagram);
  const storedDiagram = useDiagramStore((state) => (id ? state.diagrams[id] : undefined));
  const error = useDiagramStore((state) => (id ? state.errors[id] : null));

  // Use TanStack Query for fetching
  const { data: diagram, isLoading } = useDiagramQuery(id);

  // Sync fetched diagram to Zustand store for command system access
  useEffect(() => {
    if (diagram) {
      setDiagram(diagram);
    }
  }, [diagram, setDiagram]);

  // Clear diagram from store and invalidate query cache on unmount to ensure fresh data on reopen
  useEffect(() => {
    return () => {
      if (id) {
        clearDiagram(id);
        queryClient.invalidateQueries({ queryKey: queryKeys.diagrams.detail(id) });
      }
    };
  }, [id, clearDiagram, queryClient]);

  return {
    // Return store diagram for immediate updates from commands, or query data
    diagram: storedDiagram ?? diagram ?? undefined,
    loading: isLoading,
    error,
  };
}

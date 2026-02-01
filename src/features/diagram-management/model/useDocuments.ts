import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDocumentStore } from '@/entities/document/store/useDocumentStore';
import { useDocumentQuery } from '@/entities/document/api/queries';
import { queryKeys } from '@/shared/lib/query';

/**
 * Hook to lazy load and access a single document by ID
 * Uses TanStack Query for data fetching with automatic caching and background refresh.
 */
export function useDocument(id: string | undefined) {
  const queryClient = useQueryClient();
  const setDocument = useDocumentStore((state) => state.setDocument);
  const clearDocument = useDocumentStore((state) => state.clearDocument);
  const storedDocument = useDocumentStore((state) => (id ? state.documents[id] : undefined));
  const error = useDocumentStore((state) => (id ? state.errors[id] : null));

  // Use TanStack Query for fetching
  const { data: document, isLoading } = useDocumentQuery(id);

  // Sync fetched document to Zustand store
  useEffect(() => {
    if (document) {
      setDocument(document);
    }
  }, [document, setDocument]);

  // Clear document from store and invalidate query cache on unmount to ensure fresh data on reopen
  useEffect(() => {
    return () => {
      if (id) {
        clearDocument(id);
        queryClient.invalidateQueries({ queryKey: queryKeys.documents.detail(id) });
      }
    };
  }, [id, clearDocument, queryClient]);

  return {
    // Return store document for immediate updates, or query data
    document: storedDocument ?? document ?? undefined,
    loading: isLoading,
    error,
  };
}

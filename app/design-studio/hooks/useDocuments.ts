import { useEffect } from 'react';
import { useDocumentStore } from '~/core/entities/design-studio';

/**
 * Hook to lazy load and access a single document by ID
 */
export function useDocument(id: string | undefined) {
  const document = useDocumentStore((state) => (id ? state.documents[id] : undefined));
  const loading = useDocumentStore((state) => (id ? state.loading[id] : false));
  const error = useDocumentStore((state) => (id ? state.errors[id] : null));
  const fetchDocument = useDocumentStore((state) => state.fetchDocument);

  useEffect(() => {
    if (id && !document && !loading) {
      fetchDocument(id);
    }
  }, [id, document, loading, fetchDocument]);

  return { document, loading, error };
}

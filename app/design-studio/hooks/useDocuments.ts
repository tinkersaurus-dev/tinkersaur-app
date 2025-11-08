import { useEffect } from 'react';
import { useDesignStudioEntityStore } from '~/core/entities/design-studio';

/**
 * Hook to lazy load and access a single document by ID
 */
export function useDocument(id: string | undefined) {
  const document = useDesignStudioEntityStore((state) => (id ? state.documents[id] : undefined));
  const loading = useDesignStudioEntityStore((state) => (id ? state.loading.documents[id] : false));
  const error = useDesignStudioEntityStore((state) => (id ? state.errors.documents[id] : null));
  const fetchDocument = useDesignStudioEntityStore((state) => state.fetchDocument);

  useEffect(() => {
    if (id && !document && !loading) {
      fetchDocument(id);
    }
  }, [id, document, loading, fetchDocument]);

  return { document, loading, error };
}

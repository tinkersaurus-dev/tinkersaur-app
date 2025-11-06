import { useEffect, useMemo } from 'react';
import { useDesignStudioEntityStore } from '~/core/entities/design-studio';

/**
 * Hook to fetch and access all documents for a solution
 */
export function useDocuments(solutionId: string) {
  const documents = useDesignStudioEntityStore((state) => state.documents);
  const loading = useDesignStudioEntityStore((state) => state.loading.documents);
  const error = useDesignStudioEntityStore((state) => state.errors.documents);
  const fetchDocuments = useDesignStudioEntityStore((state) => state.fetchDocuments);

  useEffect(() => {
    fetchDocuments(solutionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solutionId]); // Only re-fetch when solutionId changes

  return { documents, loading, error };
}

/**
 * Hook to get documents for a specific design work
 */
export function useDocumentsByDesignWork(designWorkId: string | undefined) {
  const documents = useDesignStudioEntityStore((state) => state.documents);

  const filteredDocuments = useMemo(
    () => (designWorkId ? documents.filter((d) => d.designWorkId === designWorkId) : []),
    [documents, designWorkId]
  );

  return filteredDocuments;
}

/**
 * Hook to get a single document by ID
 */
export function useDocument(id: string | undefined) {
  const documents = useDesignStudioEntityStore((state) => state.documents);

  const document = useMemo(() => (id ? documents.find((d) => d.id === id) : undefined), [documents, id]);

  return document;
}

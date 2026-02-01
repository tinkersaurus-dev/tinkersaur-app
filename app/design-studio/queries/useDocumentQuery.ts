import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES, REFETCH_INTERVALS } from '@/shared/lib/query';
import { documentApi } from '@/entities/document';

/**
 * Query hook for fetching documents by design work
 */
export function useDocumentsQuery(designWorkId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.documents.list(designWorkId!),
    queryFn: () => documentApi.list(designWorkId!),
    enabled: !!designWorkId,
    staleTime: STALE_TIMES.documents,
    refetchInterval: REFETCH_INTERVALS.documents,
  });
}

/**
 * Query hook for fetching a single document
 */
export function useDocumentQuery(documentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.documents.detail(documentId!),
    queryFn: () => documentApi.get(documentId!),
    enabled: !!documentId,
    staleTime: STALE_TIMES.documents,
    refetchInterval: REFETCH_INTERVALS.documents,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Prefetch documents for SSR
 */
export function prefetchDocuments(designWorkId: string) {
  return {
    queryKey: queryKeys.documents.list(designWorkId),
    queryFn: () => documentApi.list(designWorkId),
    staleTime: STALE_TIMES.documents,
  };
}

/**
 * Prefetch a single document for SSR
 */
export function prefetchDocument(documentId: string) {
  return {
    queryKey: queryKeys.documents.detail(documentId),
    queryFn: () => documentApi.get(documentId),
    staleTime: STALE_TIMES.documents,
  };
}

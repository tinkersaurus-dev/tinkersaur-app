/**
 * Re-export TanStack Query hooks for Document entity
 * These hooks are defined in the app layer but re-exported here for convenience
 */

export {
  useDocumentsQuery,
  useDocumentQuery,
  prefetchDocuments,
  prefetchDocument,
} from '~/design-studio/queries';

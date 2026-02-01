/**
 * Document Entity
 * @module entities/document
 */

export {
  DocumentSchema,
  CreateDocumentSchema,
  UpdateDocumentSchema,
} from './model/types';

export type {
  Document,
  CreateDocumentDto,
  UpdateDocumentDto,
} from './model/types';

export { documentApi } from './api/documentApi';

// Query hooks
export {
  useDocumentsQuery,
  useDocumentQuery,
  prefetchDocuments,
  prefetchDocument,
} from './api/queries';

// Store
export { useDocumentStore } from './store/useDocumentStore';

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

// Store
export { useDocumentStore } from './store/useDocumentStore';

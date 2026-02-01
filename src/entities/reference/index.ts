/**
 * Reference Entity
 * @module entities/reference
 */

export {
  ContentTypeSchema,
  ReferenceTypeSchema,
  DropTargetSchema,
  ReferenceSchema,
  ReferenceRefSchema,
  CreateReferenceSchema,
  UpdateReferenceSchema,
} from './model/types';

export type {
  ContentType,
  ReferenceType,
  DropTarget,
  Reference,
  ReferenceRef,
  CreateReference,
  UpdateReference,
} from './model/types';

export { referenceApi } from './api/referenceApi';

// Query hooks
export {
  useReferencesQuery,
  useReferenceQuery,
  prefetchReferences,
  prefetchReference,
} from './api/queries';

// Store
export { useReferenceStore } from './store/useReferenceStore';

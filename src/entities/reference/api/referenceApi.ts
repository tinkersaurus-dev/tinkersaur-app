import type { Reference, CreateReference, UpdateReference } from '../model/types';
import { createEntityApi } from '@/shared/api';

/**
 * Reference API Client
 * Uses createEntityApi factory for standard CRUD operations
 */
export const referenceApi = createEntityApi<Reference, CreateReference>({
  endpoint: '/api/references',
  parentParam: 'designWorkId',
});

// Re-export for backwards compatibility with UpdateReference usage
export type { UpdateReference };

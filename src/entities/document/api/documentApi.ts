import type { Document, CreateDocumentDto, UpdateDocumentDto } from '../model/types';
import { createEntityApi, type EntityApi } from '@/shared/api';

/**
 * Document API Client
 * Uses createEntityApi factory with deleteByDesignWorkId extension
 */
export const documentApi = createEntityApi<
  Document,
  CreateDocumentDto,
  {
    deleteByDesignWorkId(designWorkId: string): Promise<number>;
  }
>({
  endpoint: '/api/documents',
  parentParam: 'designWorkId',
  extensions: (baseApi) => ({
    async deleteByDesignWorkId(designWorkId: string): Promise<number> {
      const typedApi = baseApi as EntityApi<Document, CreateDocumentDto>;
      const documents = await typedApi.list(designWorkId);
      for (const doc of documents) {
        await typedApi.delete(doc.id);
      }
      return documents.length;
    },
  }),
});

// Re-export for backwards compatibility with UpdateDocumentDto usage
export type { UpdateDocumentDto };

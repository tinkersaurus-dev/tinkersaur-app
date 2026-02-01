import type { Interface, CreateInterfaceDto, UpdateInterfaceDto } from '../model/types';
import { createEntityApi, type EntityApi } from '@/shared/api';

/**
 * Interface API Client
 * Uses createEntityApi factory with deleteByDesignWorkId extension
 */
export const interfaceApi = createEntityApi<
  Interface,
  CreateInterfaceDto,
  {
    deleteByDesignWorkId(designWorkId: string): Promise<number>;
  }
>({
  endpoint: '/api/interfaces',
  parentParam: 'designWorkId',
  extensions: (baseApi) => ({
    async deleteByDesignWorkId(designWorkId: string): Promise<number> {
      const typedApi = baseApi as EntityApi<Interface, CreateInterfaceDto>;
      const interfaces = await typedApi.list(designWorkId);
      for (const iface of interfaces) {
        await typedApi.delete(iface.id);
      }
      return interfaces.length;
    },
  }),
});

// Re-export for backwards compatibility with UpdateInterfaceDto usage
export type { UpdateInterfaceDto };

import { queryKeys } from '~/core/query/queryKeys';
import { createPaginatedQueryHook } from '~/core/query/createPaginatedQueryHook';
import { personaApi } from '~/core/entities/product-management/api';
import type { PersonaListParams } from '~/core/api/types';

/**
 * Query hook for fetching paginated personas
 */
export const usePersonasPaginatedQuery = createPaginatedQueryHook({
  entityName: 'personas',
  getQueryKey: (params: PersonaListParams) => queryKeys.personas.listPaginated(params),
  queryFn: (params: PersonaListParams) => personaApi.listPaginated(params),
  staleTimeKey: 'personas',
});

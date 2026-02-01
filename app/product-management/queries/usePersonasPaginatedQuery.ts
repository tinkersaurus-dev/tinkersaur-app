import { queryKeys } from '@/shared/lib/query';
import { createPaginatedQueryHook } from '@/shared/lib/query';
import { personaApi } from '@/entities/persona';
import type { PersonaListParams } from '@/shared/api';

/**
 * Query hook for fetching paginated personas
 */
export const usePersonasPaginatedQuery = createPaginatedQueryHook({
  entityName: 'personas',
  getQueryKey: (params: PersonaListParams) => queryKeys.personas.listPaginated(params),
  queryFn: (params: PersonaListParams) => personaApi.listPaginated(params),
  staleTimeKey: 'personas',
});

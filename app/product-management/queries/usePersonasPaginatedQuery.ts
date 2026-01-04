import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { personaApi } from '~/core/entities/product-management/api';
import type { PersonaListParams } from '~/core/api/types';

/**
 * Query hook for fetching paginated personas
 */
export function usePersonasPaginatedQuery(params: PersonaListParams | null) {
  return useQuery({
    queryKey: params ? queryKeys.personas.listPaginated(params) : ['personas', 'disabled'],
    queryFn: () => personaApi.listPaginated(params!),
    enabled: !!params?.teamId,
    staleTime: STALE_TIMES.personas,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: 'always',
  });
}

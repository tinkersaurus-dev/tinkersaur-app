import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '~/core/query/queryKeys';
import { personaApi } from '~/core/entities/product-management/api';
import type { FindSimilarPersonasRequest } from '~/core/entities/product-management/types';

/**
 * Query hook for finding similar personas
 * Useful for detecting duplicates or suggesting personas to merge
 */
export function useSimilarPersonasQuery(
  request: FindSimilarPersonasRequest | null,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: queryKeys.personas.similar(request),
    queryFn: () => personaApi.findSimilar(request!),
    enabled: !!request && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

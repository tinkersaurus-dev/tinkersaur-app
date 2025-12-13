import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { personaUseCaseApi } from '~/core/entities/product-management/api';

/**
 * Query hook for fetching persona-use case associations by persona
 */
export function usePersonaUseCasesQuery(personaId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.personaUseCases.list(personaId!),
    queryFn: () => personaUseCaseApi.listByPersona(personaId!),
    enabled: !!personaId,
    staleTime: STALE_TIMES.personas,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Query hook for fetching persona-use case associations by use case
 */
export function useUseCasePersonasQuery(useCaseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.personaUseCases.byUseCase(useCaseId!),
    queryFn: () => personaUseCaseApi.listByUseCase(useCaseId!),
    enabled: !!useCaseId,
    staleTime: STALE_TIMES.personas,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Prefetch persona-use case associations for SSR
 */
export function prefetchPersonaUseCases(personaId: string) {
  return {
    queryKey: queryKeys.personaUseCases.list(personaId),
    queryFn: () => personaUseCaseApi.listByPersona(personaId),
    staleTime: STALE_TIMES.personas,
  };
}

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES } from '@/shared/lib/query';
import { personaApi } from '@/entities/persona';

/**
 * Query hook for fetching personas by team
 */
export function usePersonasQuery(teamId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.personas.list(teamId!),
    queryFn: () => personaApi.list(teamId!),
    enabled: !!teamId,
    staleTime: STALE_TIMES.personas,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Query hook for fetching a single persona
 */
export function usePersonaQuery(personaId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.personas.detail(personaId!),
    queryFn: () => personaApi.get(personaId!),
    enabled: !!personaId,
    staleTime: STALE_TIMES.personas,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Prefetch personas for SSR
 */
export function prefetchPersonas(teamId: string) {
  return {
    queryKey: queryKeys.personas.list(teamId),
    queryFn: () => personaApi.list(teamId),
    staleTime: STALE_TIMES.personas,
  };
}

/**
 * Prefetch a single persona for SSR
 */
export function prefetchPersona(personaId: string) {
  return {
    queryKey: queryKeys.personas.detail(personaId),
    queryFn: () => personaApi.get(personaId),
    staleTime: STALE_TIMES.personas,
  };
}

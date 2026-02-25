import { useQuery, useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES } from '@/shared/lib/query';
import { createPaginatedQueryHook } from '@/shared/lib/query';
import { personaApi } from './personaApi';
import type { FindSimilarPersonasRequest, Persona } from '../model/types';
import type { PersonaListParams } from '@/shared/api';

/**
 * Query hook for fetching personas by team
 */
export function usePersonasQuery(teamId: string | undefined, solutionId?: string) {
  return useQuery({
    queryKey: queryKeys.personas.list(teamId!, solutionId),
    queryFn: () => personaApi.listByTeam(teamId!, solutionId),
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

/**
 * Query hook for fetching paginated personas
 */
export const usePersonasPaginatedQuery = createPaginatedQueryHook({
  entityName: 'personas',
  getQueryKey: (params: PersonaListParams) => queryKeys.personas.listPaginated(params),
  queryFn: (params: PersonaListParams) => personaApi.listPaginated(params),
  staleTimeKey: 'personas',
});

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

/**
 * Hook to fetch multiple persona details in parallel
 * Returns data as a map for easy lookup by ID
 */
export function usePersonaDetailsQuery(personaIds: string[] | undefined) {
  const ids = useMemo(() => personaIds ?? [], [personaIds]);

  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: queryKeys.personas.detail(id),
      queryFn: () => personaApi.get(id),
      staleTime: STALE_TIMES.personas,
      enabled: !!id,
    })),
  });

  const dataMap = useMemo(() => {
    const map: Record<string, Persona> = {};
    queries.forEach((query, index) => {
      if (query.data) {
        map[ids[index]] = query.data;
      }
    });
    return map;
  }, [queries, ids]);

  const nameMap = useMemo(() => {
    const map: Record<string, string> = {};
    queries.forEach((query, index) => {
      if (query.data) {
        map[ids[index]] = query.data.name;
      }
    });
    return map;
  }, [queries, ids]);

  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);
  const errors = queries.filter((q) => q.error).map((q) => q.error);

  return {
    queries,
    dataMap,
    nameMap,
    data: Object.values(dataMap),
    isLoading,
    isError,
    errors,
  };
}

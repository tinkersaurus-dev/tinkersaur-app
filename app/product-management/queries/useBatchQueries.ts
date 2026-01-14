import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { useCaseApi, personaApi } from '~/core/entities/product-management/api';
import type { UseCase, Persona } from '~/core/entities/product-management/types';

/**
 * Hook to fetch multiple use case details in parallel
 * Returns data as a map for easy lookup by ID
 */
export function useUseCaseDetailsQuery(useCaseIds: string[] | undefined) {
  const ids = useMemo(() => useCaseIds ?? [], [useCaseIds]);

  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: queryKeys.useCases.detail(id),
      queryFn: () => useCaseApi.get(id),
      staleTime: STALE_TIMES.useCases,
      enabled: !!id,
    })),
  });

  const dataMap = useMemo(() => {
    const map: Record<string, UseCase> = {};
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

/**
 * Utility to combine loading states from multiple query results
 */
export function useCombinedQueryState(queries: UseQueryResult<unknown, Error>[]) {
  const isLoading = queries.some((q) => q.isLoading);
  const isFetching = queries.some((q) => q.isFetching);
  const isError = queries.some((q) => q.isError);
  const error = queries.find((q) => q.error)?.error;

  return { isLoading, isFetching, isError, error };
}

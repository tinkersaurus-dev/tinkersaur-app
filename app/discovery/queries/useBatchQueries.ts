import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES } from '@/shared/lib/query';
import { intakeSourceApi, type IntakeSource } from '@/entities/intake-source';
import { SOURCE_TYPES, type SourceTypeKey } from '@/entities/source-type';

/**
 * Hook to fetch multiple intake source details in parallel
 * Returns data as a map for easy lookup by ID
 */
export function useIntakeSourceDetailsQuery(intakeSourceIds: string[] | undefined) {
  const ids = useMemo(() => intakeSourceIds ?? [], [intakeSourceIds]);

  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: queryKeys.intakeSources.detail(id),
      queryFn: () => intakeSourceApi.get(id),
      staleTime: STALE_TIMES.intakeSources,
      enabled: !!id,
    })),
  });

  const dataMap = useMemo(() => {
    const map: Record<string, IntakeSource> = {};
    queries.forEach((query, index) => {
      if (query.data) {
        map[ids[index]] = query.data;
      }
    });
    return map;
  }, [queries, ids]);

  /**
   * Map of intakeSourceId -> display name
   * Uses meetingName, surveyName, ticketId, or source type label
   */
  const nameMap = useMemo(() => {
    const map: Record<string, string> = {};
    queries.forEach((query, index) => {
      if (query.data) {
        const source = query.data;
        if (source.meetingName) {
          map[ids[index]] = source.meetingName;
        } else if (source.surveyName) {
          map[ids[index]] = source.surveyName;
        } else if (source.ticketId) {
          map[ids[index]] = `Ticket ${source.ticketId}`;
        } else {
          const sourceType = source.sourceType as SourceTypeKey;
          map[ids[index]] = SOURCE_TYPES[sourceType]?.label || sourceType;
        }
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

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES } from '@/shared/lib/query';
import { requirementApi } from '@/entities/requirement';
import type { Requirement } from '@/entities/requirement';
import type { UseCase } from '@/entities/use-case';

/**
 * Extended requirement type with use case context
 */
export interface RequirementWithUseCase extends Requirement {
  useCaseName: string;
}

/**
 * Query hook for fetching requirements across multiple use cases
 * Used in Design Studio overview to show all requirements for a solution
 */
export function useRequirementsBySolutionQuery(
  useCases: UseCase[] | undefined,
  enabled: boolean = true
) {
  // Create queries for each use case
  const queries = useQueries({
    queries: (useCases || []).map((useCase) => ({
      queryKey: queryKeys.requirements.list(useCase.id),
      queryFn: () => requirementApi.list(useCase.id),
      enabled: enabled && !!useCase.id,
      staleTime: STALE_TIMES.requirements,
      refetchOnWindowFocus: 'always' as const,
    })),
  });

  // Combine results with use case context
  const data = useMemo<RequirementWithUseCase[]>(() => {
    if (!useCases) return [];

    const requirements: RequirementWithUseCase[] = [];

    queries.forEach((query, index) => {
      if (query.data && useCases[index]) {
        const useCase = useCases[index];
        query.data.forEach((req) => {
          requirements.push({
            ...req,
            useCaseName: useCase.name,
          });
        });
      }
    });

    // Sort by status (Todo first, then InProgress, then Done) then by use case name
    const statusOrder: Record<string, number> = { Todo: 0, InProgress: 1, Done: 2 };
    return requirements.sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) {
        return statusDiff;
      }
      return a.useCaseName.localeCompare(b.useCaseName);
    });
  }, [queries, useCases]);

  const isLoading = queries.some((q) => q.isLoading);
  const error = queries.find((q) => q.error)?.error ?? null;

  return {
    data,
    isLoading,
    error,
  };
}

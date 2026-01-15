import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { requirementApi } from '~/core/entities/product-management/api';
import type { Requirement } from '~/core/entities/product-management/types';
import type { UseCase } from '~/core/entities/product-management/types';

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

    // Sort by priority (descending) then by use case name
    return requirements.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
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

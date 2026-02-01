import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES } from '@/shared/lib/query';
import { requirementApi } from '@/entities/requirement';

/**
 * Query hook for fetching requirements by use case
 */
export function useRequirementsQuery(useCaseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.requirements.list(useCaseId!),
    queryFn: () => requirementApi.list(useCaseId!),
    enabled: !!useCaseId,
    staleTime: STALE_TIMES.requirements,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Query hook for fetching a single requirement
 */
export function useRequirementQuery(requirementId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.requirements.detail(requirementId!),
    queryFn: () => requirementApi.get(requirementId!),
    enabled: !!requirementId,
    staleTime: STALE_TIMES.requirements,
    refetchOnWindowFocus: 'always',
  });
}

/**
 * Prefetch requirements for SSR
 */
export function prefetchRequirements(useCaseId: string) {
  return {
    queryKey: queryKeys.requirements.list(useCaseId),
    queryFn: () => requirementApi.list(useCaseId),
    staleTime: STALE_TIMES.requirements,
  };
}

/**
 * Prefetch a single requirement for SSR
 */
export function prefetchRequirement(requirementId: string) {
  return {
    queryKey: queryKeys.requirements.detail(requirementId),
    queryFn: () => requirementApi.get(requirementId),
    staleTime: STALE_TIMES.requirements,
  };
}

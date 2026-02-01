import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES } from '@/shared/lib/query';
import { planningApi, epicApi, storyApi } from '@/entities/planning';

/**
 * Hook to fetch planning versions for a solution with their epics and stories
 */
export function usePlanningVersionsQuery(solutionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.planning.versions(solutionId ?? ''),
    queryFn: () => planningApi.getVersionsForSolution(solutionId!),
    staleTime: STALE_TIMES.useCases,
    enabled: !!solutionId,
  });
}

/**
 * Hook to fetch epics for a specific version
 */
export function useEpicsQuery(versionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.epics.byVersion(versionId ?? ''),
    queryFn: () => epicApi.list(versionId!),
    staleTime: STALE_TIMES.useCases,
    enabled: !!versionId,
  });
}

/**
 * Hook to fetch a single epic
 */
export function useEpicQuery(epicId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.epics.detail(epicId ?? ''),
    queryFn: () => epicApi.get(epicId!),
    staleTime: STALE_TIMES.useCases,
    enabled: !!epicId,
  });
}

/**
 * Hook to fetch stories for a specific epic
 */
export function useStoriesQuery(epicId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.stories.byEpic(epicId ?? ''),
    queryFn: () => storyApi.list(epicId!),
    staleTime: STALE_TIMES.useCases,
    enabled: !!epicId,
  });
}

/**
 * Hook to fetch a single story
 */
export function useStoryQuery(storyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.stories.detail(storyId ?? ''),
    queryFn: () => storyApi.get(storyId!),
    staleTime: STALE_TIMES.useCases,
    enabled: !!storyId,
  });
}

import { useQuery } from '@tanstack/react-query';
import { queryKeys, STALE_TIMES } from '@/shared/lib/query';
import { tagApi } from './tagApi';

/**
 * Query hook for fetching tags by team
 */
export function useTagsQuery(teamId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tags.list(teamId!),
    queryFn: () => tagApi.listByTeam(teamId!),
    enabled: !!teamId,
    staleTime: STALE_TIMES.tags,
    refetchOnWindowFocus: 'always',
  });
}

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { STALE_TIMES } from './queryClient';

/**
 * Configuration for creating a paginated query hook
 */
export interface PaginatedQueryConfig<TParams extends { teamId: string }, TResponse> {
  /** Entity name used for the disabled query key */
  entityName: string;
  /** Function to generate query key from params */
  getQueryKey: (params: TParams) => readonly unknown[];
  /** API function to fetch paginated data */
  queryFn: (params: TParams) => Promise<TResponse>;
  /** Key in STALE_TIMES configuration */
  staleTimeKey: keyof typeof STALE_TIMES;
}

/**
 * Factory function to create paginated query hooks with consistent configuration.
 *
 * All created hooks share:
 * - keepPreviousData for smooth pagination transitions
 * - teamId-based query enabling
 * - Configurable stale time from STALE_TIMES
 * - refetchOnWindowFocus: 'always'
 *
 * @example
 * ```ts
 * export const useFeedbacksPaginatedQuery = createPaginatedQueryHook({
 *   entityName: 'feedbacks',
 *   getQueryKey: (params) => queryKeys.feedbacks.listPaginated(params),
 *   queryFn: (params) => feedbackApi.listPaginated(params),
 *   staleTimeKey: 'feedbacks',
 * });
 * ```
 */
export function createPaginatedQueryHook<
  TParams extends { teamId: string },
  TResponse,
>(config: PaginatedQueryConfig<TParams, TResponse>) {
  return function usePaginatedQuery(params: TParams | null) {
    return useQuery({
      queryKey: params
        ? config.getQueryKey(params)
        : [config.entityName, 'disabled'],
      queryFn: () => config.queryFn(params!),
      enabled: !!params?.teamId,
      staleTime: STALE_TIMES[config.staleTimeKey],
      placeholderData: keepPreviousData,
      refetchOnWindowFocus: 'always',
    });
  };
}

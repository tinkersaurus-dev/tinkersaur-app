import { useQuery } from '@tanstack/react-query';

const DEFAULT_SIMILARITY_STALE_TIME = 60_000; // 1 minute

/**
 * Configuration for creating a batch similarity query hook
 */
export interface BatchSimilarityQueryConfig<TItem, TResult, TSimilarInfo> {
  /** Entity type name for query key (e.g., 'personas', 'useCases') */
  entityType: string;
  /** Generate a signature string from an item for cache keying */
  getItemSignature: (item: TItem) => string;
  /** API call to find similar items for a single item */
  findSimilar: (item: TItem, teamId: string) => Promise<TResult[]>;
  /** Create result info object when matches are found, return null to filter out */
  createResultInfo: (item: TItem, index: number, results: TResult[]) => TSimilarInfo | null;
  /** Stale time in ms (default: 60000) */
  staleTime?: number;
}

/**
 * Factory function to create batch similarity query hooks.
 *
 * These hooks process an array of items, finding similar matches for each,
 * and returning only items that have matches.
 *
 * @example
 * ```ts
 * export const useSimilarPersonasQuery = createBatchSimilarityQueryHook({
 *   entityType: 'personas',
 *   getItemSignature: (p) => `${p.name}|${p.description?.slice(0, 100)}`,
 *   findSimilar: (persona, teamId) => personaApi.findSimilar({
 *     teamId,
 *     name: persona.name,
 *     description: persona.description,
 *     role: persona.role,
 *     threshold: 0.5,
 *     limit: 5,
 *   }),
 *   createResultInfo: (persona, index, results) => ({
 *     personaIndex: index,
 *     personaName: persona.name,
 *     similarResults: results,
 *   }),
 * });
 * ```
 */
export function createBatchSimilarityQueryHook<TItem, TResult, TSimilarInfo>(
  config: BatchSimilarityQueryConfig<TItem, TResult, TSimilarInfo>
) {
  return function useBatchSimilarityQuery(
    items: TItem[] | null,
    teamId: string | undefined
  ) {
    return useQuery({
      queryKey: [
        'similarity',
        config.entityType,
        teamId,
        items?.map(config.getItemSignature),
      ],
      queryFn: async (): Promise<TSimilarInfo[]> => {
        const results = await Promise.all(
          items!.map(async (item, index) => {
            const similarResults = await config.findSimilar(item, teamId!);

            if (similarResults.length > 0) {
              return config.createResultInfo(item, index, similarResults);
            }
            return null;
          })
        );

        return results.filter((r) => r !== null);
      },
      enabled: !!items && !!teamId && items.length > 0,
      staleTime: config.staleTime ?? DEFAULT_SIMILARITY_STALE_TIME,
    });
  };
}

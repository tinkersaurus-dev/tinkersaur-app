/**
 * Factory for creating LLM-powered merge hooks
 * Creates hooks that send entities to tinkersaur-api for intelligent merging
 */

import { useCallback, useState } from 'react';
import { httpClient, ApiError } from '~/core/api/httpClient';

/**
 * Response type for LLM merge API endpoints
 */
export interface LLMMergeResponse<_TMergedResult> {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

/**
 * Configuration for creating an LLM merge hook
 */
export interface LLMMergeConfig<TInput, TEntity, TMergedResult> {
  /** API endpoint path (e.g., '/api/ai/merge-personas') */
  endpoint: string;
  /** Field name for items in request body (e.g., 'personas', 'useCases') */
  itemsFieldName: string;
  /** Convert entity to input format for the API */
  toInput: (entity: TEntity) => TInput;
  /** Extract merged result from response */
  getMergedResult: (response: LLMMergeResponse<TMergedResult>) => TMergedResult | undefined;
}

/**
 * Return type for LLM merge hooks
 */
export interface LLMMergeHookResult<TEntity, TMergedResult> {
  /** Trigger the merge operation */
  merge: (entities: TEntity[], teamId: string, instructions?: string) => Promise<void>;
  /** Reset the hook state (clears result and error) */
  reset: () => void;
  /** Whether a merge is in progress */
  isLoading: boolean;
  /** The merged result, if successful */
  result: TMergedResult | null;
  /** Error message, if failed */
  error: string | null | undefined;
}

/**
 * Factory function to create LLM-powered merge hooks.
 *
 * These hooks use httpClient to send entities to tinkersaur-api
 * for intelligent merging, with state management for result/error/loading.
 *
 * @example
 * ```ts
 * export const useMergePersonasLLM = createLLMMergeHook<PersonaInput, Persona, MergedPersonaData>({
 *   endpoint: '/api/ai/merge-personas',
 *   itemsFieldName: 'personas',
 *   toInput: (p) => ({
 *     name: p.name,
 *     role: p.role,
 *     description: p.description,
 *     goals: p.goals,
 *     painPoints: p.painPoints,
 *     demographics: p.demographics,
 *   }),
 *   getMergedResult: (response) => response.persona as MergedPersonaData | undefined,
 * });
 * ```
 */
export function createLLMMergeHook<TInput, TEntity, TMergedResult>(
  config: LLMMergeConfig<TInput, TEntity, TMergedResult>
): () => LLMMergeHookResult<TEntity, TMergedResult> {
  return function useLLMMerge() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<TMergedResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const merge = useCallback(
      async (entities: TEntity[], teamId: string, instructions?: string) => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
          // Convert entities to input format
          const inputs = entities.map(config.toInput);

          const response = await httpClient.post<LLMMergeResponse<TMergedResult>>(
            `${config.endpoint}?teamId=${teamId}`,
            {
              [config.itemsFieldName]: inputs,
              ...(instructions && { instructions }),
            }
          );

          if (!response.success) {
            setError(response.error || 'Merge failed');
            return;
          }

          const mergedResult = config.getMergedResult(response);
          setResult(mergedResult ?? null);
        } catch (err) {
          let errorMessage = 'Network error occurred';
          if (err instanceof ApiError) {
            errorMessage = err.message;
          } else if (err instanceof Error) {
            errorMessage = err.message;
          }
          setError(errorMessage);
        } finally {
          setIsLoading(false);
        }
      },
      []
    );

    const reset = useCallback(() => {
      setResult(null);
      setError(null);
    }, []);

    return {
      merge,
      reset,
      isLoading,
      result,
      error,
    };
  };
}

/**
 * Factory for creating LLM-powered merge hooks
 * Creates hooks that send entities to the LLM API for intelligent merging
 */

import { useFetcher } from 'react-router';
import { useCallback, useState } from 'react';

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
  /** API action path (e.g., '/api/merge-personas') */
  action: string;
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
  merge: (entities: TEntity[], instructions?: string) => void;
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
 * These hooks use useFetcher to submit entities to an LLM API endpoint
 * for intelligent merging, with state management for result/error/loading.
 *
 * @example
 * ```ts
 * export const useMergePersonasLLM = createLLMMergeHook<PersonaInput, Persona, MergedPersonaData>({
 *   action: '/api/merge-personas',
 *   itemsFieldName: 'personas',
 *   toInput: (p) => ({
 *     name: p.name,
 *     role: p.role,
 *     description: p.description,
 *     goals: p.goals,
 *     painPoints: p.painPoints,
 *     demographics: p.demographics,
 *   }),
 *   getMergedResult: (response) => response.mergedPersona as MergedPersonaData | undefined,
 * });
 * ```
 */
export function createLLMMergeHook<TInput, TEntity, TMergedResult>(
  config: LLMMergeConfig<TInput, TEntity, TMergedResult>
): () => LLMMergeHookResult<TEntity, TMergedResult> {
  return function useLLMMerge() {
    const fetcher = useFetcher<LLMMergeResponse<TMergedResult>>();
    const [lastSubmitKey, setLastSubmitKey] = useState<string | null>(null);

    const isLoading = fetcher.state === 'submitting' || fetcher.state === 'loading';

    const merge = useCallback(
      (entities: TEntity[], instructions?: string) => {
        // Convert entities to input format
        const inputs = entities.map(config.toInput);

        // Track the submission to help with reset logic
        setLastSubmitKey(Date.now().toString());

        fetcher.submit(
          JSON.stringify({
            [config.itemsFieldName]: inputs,
            ...(instructions && { instructions }),
          }),
          {
            method: 'POST',
            action: config.action,
            encType: 'application/json',
          }
        );
      },
      [fetcher]
    );

    const reset = useCallback(() => {
      setLastSubmitKey(null);
    }, []);

    // Derive result and error directly from fetcher data
    // Gate with lastSubmitKey so reset() can clear stale results
    const result = fetcher.data?.success && lastSubmitKey
      ? (config.getMergedResult(fetcher.data) ?? null)
      : null;
    const error = fetcher.data?.success === false ? fetcher.data.error : null;

    return {
      merge,
      reset,
      isLoading,
      result,
      error,
    };
  };
}

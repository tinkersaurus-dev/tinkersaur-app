/**
 * Hook for merging use cases using the LLM API
 * Sends use cases to Bedrock for intelligent merging
 */

import { useFetcher } from 'react-router';
import { useCallback, useRef } from 'react';
import type { MergedUseCaseData, UseCase } from '~/core/entities/product-management/types';

interface UseCaseInput {
  name: string;
  description: string;
}

interface MergeUseCasesLLMResponse {
  success: boolean;
  mergedUseCase?: MergedUseCaseData;
  error?: string;
}

export function useMergeUseCasesLLM() {
  const fetcher = useFetcher<MergeUseCasesLLMResponse>();
  const lastSubmitKey = useRef<string | null>(null);

  const isLoading = fetcher.state === 'submitting' || fetcher.state === 'loading';

  const merge = useCallback(
    (useCases: UseCase[] | UseCaseInput[], instructions?: string) => {
      // Convert use cases to input format
      const useCaseInputs: UseCaseInput[] = useCases.map((uc) => ({
        name: uc.name,
        description: uc.description,
      }));

      // Track the submission to help with reset logic
      lastSubmitKey.current = Date.now().toString();

      fetcher.submit(
        JSON.stringify({
          useCases: useCaseInputs,
          ...(instructions && { instructions }),
        }),
        {
          method: 'POST',
          action: '/api/merge-use-cases',
          encType: 'application/json',
        }
      );
    },
    [fetcher]
  );

  const reset = useCallback(() => {
    lastSubmitKey.current = null;
  }, []);

  // Derive result and error directly from fetcher data
  const result = fetcher.data?.success ? fetcher.data.mergedUseCase : null;
  const error = fetcher.data?.success === false ? fetcher.data.error : null;

  return {
    merge,
    reset,
    isLoading,
    result,
    error,
  };
}

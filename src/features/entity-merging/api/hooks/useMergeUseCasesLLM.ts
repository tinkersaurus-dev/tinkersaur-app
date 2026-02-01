/**
 * Hook for merging use cases using the LLM API
 * Sends use cases to tinkersaur-api for intelligent merging
 */

import { useCallback, useState } from 'react';
import {
  mergeUseCases,
  MergeUseCasesAPIError,
  type UseCaseInput,
} from '@/features/llm-generation';
import type { MergedUseCaseData, UseCase } from '@/entities/use-case';

export function useMergeUseCasesLLM() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MergedUseCaseData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const merge = useCallback(
    async (useCases: UseCase[] | UseCaseInput[], teamId: string, instructions?: string) => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        const mergedUseCase = await mergeUseCases(useCases, teamId, instructions);
        setResult(mergedUseCase);
      } catch (err) {
        let errorMessage = 'Network error occurred';
        if (err instanceof MergeUseCasesAPIError) {
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
}

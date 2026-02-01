/**
 * Hook for merging personas using the LLM API
 * Sends personas to tinkersaur-api for intelligent merging
 */

import { useCallback, useState } from 'react';
import {
  mergePersonas,
  MergePersonasAPIError,
  type PersonaInput,
} from '@/features/llm-generation';
import type { MergedPersonaData, Persona } from '@/entities/persona';

export function useMergePersonasLLM() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MergedPersonaData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const merge = useCallback(
    async (personas: Persona[] | PersonaInput[], teamId: string, instructions?: string) => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        const mergedPersona = await mergePersonas(personas, teamId, instructions);
        setResult(mergedPersona);
      } catch (err) {
        let errorMessage = 'Network error occurred';
        if (err instanceof MergePersonasAPIError) {
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

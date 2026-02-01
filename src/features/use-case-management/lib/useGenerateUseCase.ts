/**
 * Hook for generating a use case from a rough description using LLM
 */

import { useState, useCallback, useRef } from 'react';

export interface GeneratedUseCase {
  name: string;
  description: string;
}

interface GenerateUseCaseResponse {
  success: boolean;
  useCase?: GeneratedUseCase;
  error?: string;
}

export function useGenerateUseCase() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUseCase, setGeneratedUseCase] = useState<GeneratedUseCase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (roughDescription: string) => {
    if (!roughDescription.trim()) {
      setError('Description is required');
      return null;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedUseCase(null);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/generate-use-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: roughDescription }),
        signal: abortControllerRef.current.signal,
      });

      const data: GenerateUseCaseResponse = await response.json();

      if (!data.success || !data.useCase) {
        const errorMessage = data.error || 'Failed to generate use case';
        setError(errorMessage);
        return null;
      }

      setGeneratedUseCase(data.useCase);
      return data.useCase;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return null;
      }
      const message = err instanceof Error ? err.message : 'Failed to generate use case';
      setError(message);
      return null;
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
  }, []);

  const reset = useCallback(() => {
    setGeneratedUseCase(null);
    setError(null);
  }, []);

  return {
    generate,
    cancel,
    reset,
    isGenerating,
    generatedUseCase,
    error,
  };
}

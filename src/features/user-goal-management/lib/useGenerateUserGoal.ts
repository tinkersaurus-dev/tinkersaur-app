/**
 * Hook for generating a user goal from a rough description using LLM
 * Reuses the same generate-use-case endpoint (it only uses description text)
 */

import { useState, useCallback, useRef } from 'react';

export interface GeneratedUserGoal {
  name: string;
  description: string;
}

interface GenerateUserGoalResponse {
  success: boolean;
  useCase?: GeneratedUserGoal;
  error?: string;
}

export function useGenerateUserGoal() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUserGoal, setGeneratedUserGoal] = useState<GeneratedUserGoal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (roughDescription: string) => {
    if (!roughDescription.trim()) {
      setError('Description is required');
      return null;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedUserGoal(null);

    abortControllerRef.current = new AbortController();

    try {
      // Reuse the generate-use-case endpoint — it returns a name/description pair
      const response = await fetch('/api/generate-use-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: roughDescription }),
        signal: abortControllerRef.current.signal,
      });

      const data: GenerateUserGoalResponse = await response.json();

      if (!data.success || !data.useCase) {
        const errorMessage = data.error || 'Failed to generate user goal';
        setError(errorMessage);
        return null;
      }

      setGeneratedUserGoal(data.useCase);
      return data.useCase;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return null;
      }
      const message = err instanceof Error ? err.message : 'Failed to generate user goal';
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
    setGeneratedUserGoal(null);
    setError(null);
  }, []);

  return {
    generate,
    cancel,
    reset,
    isGenerating,
    generatedUserGoal,
    error,
  };
}

import { useState, useCallback } from 'react';
import { parseTranscript as parseTranscriptApi, ParseTranscriptAPIError } from '~/core/api/llm';
import type { SourceTypeKey, IntakeResult } from '~/core/entities/discovery';

interface UseParseTranscriptReturn {
  parseTranscript: (
    sourceType: SourceTypeKey,
    content: string,
    metadata: Record<string, string>,
    teamId: string
  ) => Promise<IntakeResult | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useParseTranscript(): UseParseTranscriptReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const parseTranscript = useCallback(
    async (
      sourceType: SourceTypeKey,
      content: string,
      metadata: Record<string, string>,
      teamId: string
    ): Promise<IntakeResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await parseTranscriptApi(sourceType, content, metadata, teamId);
        return result;
      } catch (err) {
        let errorMessage = 'Network error occurred';
        if (err instanceof ParseTranscriptAPIError) {
          errorMessage = err.message;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { parseTranscript, isLoading, error, clearError };
}

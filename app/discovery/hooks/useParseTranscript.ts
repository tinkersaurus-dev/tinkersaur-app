import { useState, useCallback } from 'react';
import type {
  SourceTypeKey,
  IntakeResult,
  ParseTranscriptResponse,
} from '~/core/entities/discovery';

interface UseParseTranscriptReturn {
  parseTranscript: (
    sourceType: SourceTypeKey,
    content: string,
    metadata: Record<string, string>
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
      metadata: Record<string, string>
    ): Promise<IntakeResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/parse-transcript', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceType, content, metadata }),
        });

        const data: ParseTranscriptResponse = await response.json();

        if (!data.success || !data.result) {
          const errorMessage = data.error || 'Failed to parse transcript';
          setError(errorMessage);
          return null;
        }

        return data.result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Network error occurred';
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

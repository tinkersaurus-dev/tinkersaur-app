import { useState, useCallback } from 'react';
import { parseTranscript as parseTranscriptApi, ParseTranscriptAPIError } from '@/features/llm-generation';
import type { SourceTypeKey } from '@/entities/source-type';
import type { IntakeResult } from '@/entities/intake-result';

export interface ParseError {
  message: string;
  statusCode?: number;
}

interface UseParseTranscriptReturn {
  parseTranscript: (
    sourceType: SourceTypeKey,
    content: string,
    metadata: Record<string, string>,
    teamId: string
  ) => Promise<IntakeResult | null>;
  isLoading: boolean;
  error: ParseError | null;
  clearError: () => void;
}

export function useParseTranscript(): UseParseTranscriptReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ParseError | null>(null);

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
        let statusCode: number | undefined;
        if (err instanceof ParseTranscriptAPIError) {
          errorMessage = err.message;
          statusCode = err.statusCode;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError({ message: errorMessage, statusCode });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { parseTranscript, isLoading, error, clearError };
}

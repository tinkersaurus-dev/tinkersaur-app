/**
 * Client-side API wrapper for LLM-based diagram improvement suggestions
 */

import { logger } from '~/core/utils/logger';

export interface Suggestion {
  shapeLabel: string;
  suggestion: string;
}

export interface GenerateSuggestionsRequest {
  mermaidSyntax: string;
  diagramType: string;
}

export interface GenerateSuggestionsResponse {
  success: boolean;
  suggestions?: Suggestion[];
  error?: string;
}

/**
 * Custom error class for suggestions generation failures
 */
export class SuggestionsGeneratorAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'SuggestionsGeneratorAPIError';
  }
}

/**
 * Generate improvement suggestions for a diagram using AWS Bedrock LLM
 *
 * @param mermaidSyntax - The Mermaid syntax representing the current diagram
 * @param diagramType - Type of diagram (bpmn, class, sequence, architecture)
 * @returns Promise that resolves to an array of suggestions
 * @throws SuggestionsGeneratorAPIError if generation fails
 */
export async function generateSuggestions(
  mermaidSyntax: string,
  diagramType: string
): Promise<Suggestion[]> {
  logger.debug('generateSuggestions called', {
    mermaidLength: mermaidSyntax.length,
    diagramType,
  });

  try {
    logger.info('Sending request to /api/generate-suggestions');

    // Create an AbortController with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      logger.error('Suggestions request timeout after 120 seconds');
      controller.abort();
    }, 120000);

    const response = await fetch('/api/generate-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mermaidSyntax,
        diagramType,
      } satisfies GenerateSuggestionsRequest),
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeoutId);
    });

    logger.debug('Suggestions response received', {
      status: response.status,
      ok: response.ok,
    });

    const data: GenerateSuggestionsResponse = await response.json();

    if (!response.ok || !data.success) {
      logger.error('Error in suggestions API response', undefined, {
        error: data.error,
        status: response.status,
      });
      throw new SuggestionsGeneratorAPIError(
        data.error || `Failed to generate suggestions (HTTP ${response.status})`,
        response.status
      );
    }

    if (!data.suggestions || !Array.isArray(data.suggestions)) {
      logger.error('No suggestions array in response');
      throw new SuggestionsGeneratorAPIError(
        'No suggestions returned from API',
        500
      );
    }

    logger.info('Successfully received suggestions', {
      count: data.suggestions.length,
    });
    return data.suggestions;
  } catch (error) {
    logger.error('Exception in generateSuggestions', error);
    // Re-throw our custom errors
    if (error instanceof SuggestionsGeneratorAPIError) {
      throw error;
    }

    // Wrap network errors and other exceptions
    throw new SuggestionsGeneratorAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

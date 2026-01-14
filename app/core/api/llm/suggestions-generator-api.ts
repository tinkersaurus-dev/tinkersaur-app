/**
 * Client-side API wrapper for LLM-based diagram improvement suggestions
 * Calls tinkersaur-api which proxies to tinkersaur-ai
 */

import { httpClient, ApiError } from '~/core/api/httpClient';
import { logger } from '~/core/utils/logger';

export interface Suggestion {
  shapeLabel: string;
  suggestion: string;
}

export interface GenerateSuggestionsRequest {
  mermaid: string;
  diagramType: string;
  context?: string;
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
 * @param teamId - The team ID for authorization
 * @param context - Optional additional context
 * @returns Promise that resolves to an array of suggestions
 * @throws SuggestionsGeneratorAPIError if generation fails
 */
export async function generateSuggestions(
  mermaidSyntax: string,
  diagramType: string,
  teamId: string,
  context?: string
): Promise<Suggestion[]> {
  logger.debug('generateSuggestions called', {
    mermaidLength: mermaidSyntax.length,
    diagramType,
    teamId,
  });

  try {
    const data = await httpClient.post<GenerateSuggestionsResponse>(
      `/api/ai/generate-suggestions?teamId=${teamId}`,
      { mermaid: mermaidSyntax, diagramType, context }
    );

    if (!data.success) {
      logger.error('Error in suggestions API response', undefined, {
        error: data.error,
      });
      throw new SuggestionsGeneratorAPIError(
        data.error || 'Failed to generate suggestions',
        500
      );
    }

    if (!data.suggestions || !Array.isArray(data.suggestions)) {
      logger.error('No suggestions array in response');
      throw new SuggestionsGeneratorAPIError(
        'No suggestions returned from API',
        500
      );
    }

    return data.suggestions;
  } catch (error) {
    logger.error('Exception in generateSuggestions', error);

    // Re-throw our custom errors
    if (error instanceof SuggestionsGeneratorAPIError) {
      throw error;
    }

    // Handle API errors
    if (error instanceof ApiError) {
      throw new SuggestionsGeneratorAPIError(error.message, error.status);
    }

    // Wrap network errors and other exceptions
    throw new SuggestionsGeneratorAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

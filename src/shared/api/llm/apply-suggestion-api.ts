/**
 * Client-side API wrapper for applying suggestions to diagram shapes
 * Calls tinkersaur-api which proxies to tinkersaur-ai
 */

import { httpClient, ApiError } from '../httpClient';

export interface ApplySuggestionRequest {
  shapeMermaid: string;
  suggestion: string;
  diagramType: string;
}

export interface ApplySuggestionResponse {
  success: boolean;
  mermaid?: string;
  error?: string;
}

export class ApplySuggestionAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApplySuggestionAPIError';
  }
}

/**
 * Apply a suggestion to a shape by calling the LLM API
 * @param targetShapeMermaid The mermaid syntax for the target shape
 * @param suggestion The suggestion to apply
 * @param diagramType The type of diagram
 * @param teamId The team ID for authorization
 * @returns The updated mermaid syntax implementing the suggestion
 * @throws ApplySuggestionAPIError if the API call fails
 */
export async function applySuggestion(
  targetShapeMermaid: string,
  suggestion: string,
  diagramType: string,
  teamId: string
): Promise<string> {
  try {
    const data = await httpClient.post<ApplySuggestionResponse>(
      `/api/ai/apply-suggestion?teamId=${teamId}`,
      { shapeMermaid: targetShapeMermaid, suggestion, diagramType }
    );

    if (!data.success) {
      throw new ApplySuggestionAPIError(
        data.error || 'Failed to apply suggestion'
      );
    }

    if (!data.mermaid) {
      throw new ApplySuggestionAPIError('No mermaid returned from API');
    }

    return data.mermaid;
  } catch (error) {
    if (error instanceof ApplySuggestionAPIError) {
      throw error;
    }

    if (error instanceof ApiError) {
      throw new ApplySuggestionAPIError(error.message);
    }

    throw new ApplySuggestionAPIError(
      error instanceof Error ? error.message : 'Network error occurred'
    );
  }
}

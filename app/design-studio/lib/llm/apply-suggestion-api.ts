/**
 * Client-side API wrapper for applying suggestions to diagram shapes
 * Calls the /api/apply-suggestion endpoint to get updated mermaid
 */

export interface ApplySuggestionRequest {
  targetShapeMermaid: string;
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
 * @param request The request containing target shape mermaid, suggestion, and diagram type
 * @returns The updated mermaid syntax implementing the suggestion
 * @throws ApplySuggestionAPIError if the API call fails
 */
export async function applySuggestion(
  request: ApplySuggestionRequest
): Promise<string> {
  const response = await fetch('/api/apply-suggestion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data: ApplySuggestionResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new ApplySuggestionAPIError(
      data.error || 'Failed to apply suggestion'
    );
  }

  if (!data.mermaid) {
    throw new ApplySuggestionAPIError('No mermaid returned from API');
  }

  return data.mermaid;
}

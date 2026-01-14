/**
 * Client-side API wrapper for LLM-based Mermaid diagram generation
 * Calls tinkersaur-api which proxies to tinkersaur-ai
 */

import { httpClient, ApiError } from '~/core/api/httpClient';
import { logger } from '~/core/utils/logger';

export interface GenerateMermaidRequest {
  prompt: string;
  diagramType: 'bpmn' | 'class' | 'sequence' | 'entity-relationship';
}

export interface GenerateMermaidResponse {
  success: boolean;
  mermaid?: string;
  error?: string;
}

/**
 * Custom error class for Mermaid generation failures
 */
export class MermaidGeneratorAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'MermaidGeneratorAPIError';
  }
}

/**
 * Generate Mermaid diagram syntax using AWS Bedrock LLM
 *
 * @param prompt - User's natural language description of the diagram
 * @param diagramType - Type of diagram to generate (bpmn, class, sequence)
 * @param teamId - The team ID for authorization
 * @returns Promise that resolves to the generated Mermaid syntax string
 * @throws MermaidGeneratorAPIError if generation fails
 */
export async function generateMermaid(
  prompt: string,
  diagramType: 'bpmn' | 'class' | 'sequence' | 'entity-relationship',
  teamId: string
): Promise<string> {
  logger.debug('generateMermaid called', {
    promptLength: prompt.length,
    diagramType,
    teamId,
  });

  try {
    const data = await httpClient.post<GenerateMermaidResponse>(
      `/api/ai/generate-mermaid?teamId=${teamId}`,
      { prompt, diagramType }
    );

    if (!data.success) {
      logger.error('Error in API response', undefined, {
        error: data.error,
      });
      throw new MermaidGeneratorAPIError(
        data.error || 'Failed to generate diagram',
        500
      );
    }

    if (!data.mermaid) {
      logger.error('No mermaid syntax in response');
      throw new MermaidGeneratorAPIError(
        'No Mermaid syntax returned from API',
        500
      );
    }

    return data.mermaid;
  } catch (error) {
    logger.error('Exception in generateMermaid', error);

    // Re-throw our custom errors
    if (error instanceof MermaidGeneratorAPIError) {
      throw error;
    }

    // Handle API errors
    if (error instanceof ApiError) {
      throw new MermaidGeneratorAPIError(error.message, error.status);
    }

    // Wrap network errors and other exceptions
    throw new MermaidGeneratorAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

/**
 * Client-side API wrapper for LLM-based Mermaid diagram generation
 */

import { logger } from '~/core/utils/logger';

export interface GenerateMermaidRequest {
  prompt: string;
  diagramType: 'bpmn' | 'class' | 'sequence';
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
 * @returns Promise that resolves to the generated Mermaid syntax string
 * @throws MermaidGeneratorAPIError if generation fails
 */
export async function generateMermaid(
  prompt: string,
  diagramType: 'bpmn' | 'class' | 'sequence'
): Promise<string> {
  logger.debug('generateMermaid called', {
    promptLength: prompt.length,
    diagramType,
  });

  try {
    logger.info('Sending request to /api/generate-mermaid');

    // Create an AbortController with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      logger.error('Request timeout after 120 seconds');
      controller.abort();
    }, 120000);

    const response = await fetch('/api/generate-mermaid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        diagramType,
      } satisfies GenerateMermaidRequest),
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeoutId);
    });

    logger.debug('Response received', {
      status: response.status,
      ok: response.ok,
    });

    const data: GenerateMermaidResponse = await response.json();

    if (!response.ok || !data.success) {
      logger.error('Error in API response', undefined, {
        error: data.error,
        status: response.status,
      });
      throw new MermaidGeneratorAPIError(
        data.error || `Failed to generate diagram (HTTP ${response.status})`,
        response.status
      );
    }

    if (!data.mermaid) {
      logger.error('No mermaid syntax in response');
      throw new MermaidGeneratorAPIError(
        'No Mermaid syntax returned from API',
        500
      );
    }

    logger.info('Successfully received mermaid syntax', {
      length: data.mermaid.length,
    });
    return data.mermaid;
  } catch (error) {
    logger.error('Exception in generateMermaid', error);
    // Re-throw our custom errors
    if (error instanceof MermaidGeneratorAPIError) {
      throw error;
    }

    // Wrap network errors and other exceptions
    throw new MermaidGeneratorAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

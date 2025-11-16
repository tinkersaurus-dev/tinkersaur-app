/**
 * Client-side API wrapper for LLM-based Mermaid diagram generation
 */

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
  console.log('[mermaid-generator-api] generateMermaid called');
  console.log('[mermaid-generator-api] prompt:', prompt);
  console.log('[mermaid-generator-api] diagramType:', diagramType);

  try {
    console.log('[mermaid-generator-api] Sending fetch request to /api/generate-mermaid...');

    // Create an AbortController with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error('[mermaid-generator-api] Request timeout after 120 seconds');
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

    console.log('[mermaid-generator-api] Response received, status:', response.status);
    console.log('[mermaid-generator-api] Response headers:', Object.fromEntries(response.headers.entries()));
    const data: GenerateMermaidResponse = await response.json();
    console.log('[mermaid-generator-api] Response data:', data);

    if (!response.ok || !data.success) {
      console.error('[mermaid-generator-api] Error in response:', data.error);
      throw new MermaidGeneratorAPIError(
        data.error || `Failed to generate diagram (HTTP ${response.status})`,
        response.status
      );
    }

    if (!data.mermaid) {
      console.error('[mermaid-generator-api] No mermaid syntax in response');
      throw new MermaidGeneratorAPIError(
        'No Mermaid syntax returned from API',
        500
      );
    }

    console.log('[mermaid-generator-api] Successfully received mermaid syntax');
    return data.mermaid;
  } catch (error) {
    console.error('[mermaid-generator-api] Exception caught:', error);
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

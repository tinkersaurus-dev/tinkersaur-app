/**
 * Client-side API wrapper for LLM-based user documentation generation
 */

import { logger } from '~/core/utils/logger';

export interface GenerateUserDocsRequest {
  content: string;
}

export interface GenerateUserDocsResponse {
  success: boolean;
  userDocs?: string;
  error?: string;
}

/**
 * Custom error class for user documentation generation failures
 */
export class UserDocsGeneratorAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'UserDocsGeneratorAPIError';
  }
}

/**
 * Generate user documentation using AWS Bedrock LLM
 *
 * @param content - Compiled design documentation (diagrams + documents)
 * @returns Promise that resolves to the generated user documentation markdown
 * @throws UserDocsGeneratorAPIError if generation fails
 */
export async function generateUserDocs(content: string): Promise<string> {
  logger.debug('generateUserDocs called', {
    contentLength: content.length,
  });

  try {
    logger.info('Sending request to /api/generate-user-docs');

    // Create an AbortController with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      logger.error('Request timeout after 120 seconds');
      controller.abort();
    }, 120000);

    const response = await fetch('/api/generate-user-docs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
      } satisfies GenerateUserDocsRequest),
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeoutId);
    });

    logger.debug('Response received', {
      status: response.status,
      ok: response.ok,
    });

    const data: GenerateUserDocsResponse = await response.json();

    if (!response.ok || !data.success) {
      logger.error('Error in API response', undefined, {
        error: data.error,
        status: response.status,
      });
      throw new UserDocsGeneratorAPIError(
        data.error || `Failed to generate user documentation (HTTP ${response.status})`,
        response.status
      );
    }

    if (!data.userDocs) {
      logger.error('No user documentation in response');
      throw new UserDocsGeneratorAPIError(
        'No user documentation returned from API',
        500
      );
    }

    logger.info('Successfully received user documentation', {
      length: data.userDocs.length,
    });
    return data.userDocs;
  } catch (error) {
    logger.error('Exception in generateUserDocs', error);
    // Re-throw our custom errors
    if (error instanceof UserDocsGeneratorAPIError) {
      throw error;
    }

    // Wrap network errors and other exceptions
    throw new UserDocsGeneratorAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

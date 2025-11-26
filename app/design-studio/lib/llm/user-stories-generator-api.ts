/**
 * Client-side API wrapper for LLM-based user story generation
 */

import { logger } from '~/core/utils/logger';

export interface GenerateUserStoriesRequest {
  content: string;
}

export interface GenerateUserStoriesResponse {
  success: boolean;
  userStories?: string;
  error?: string;
}

/**
 * Custom error class for user story generation failures
 */
export class UserStoriesGeneratorAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'UserStoriesGeneratorAPIError';
  }
}

/**
 * Generate user stories with acceptance criteria using AWS Bedrock LLM
 *
 * @param content - Compiled design documentation (diagrams + documents)
 * @returns Promise that resolves to the generated user stories markdown
 * @throws UserStoriesGeneratorAPIError if generation fails
 */
export async function generateUserStories(content: string): Promise<string> {
  logger.debug('generateUserStories called', {
    contentLength: content.length,
  });

  try {
    logger.info('Sending request to /api/generate-user-stories');

    // Create an AbortController with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      logger.error('Request timeout after 120 seconds');
      controller.abort();
    }, 120000);

    const response = await fetch('/api/generate-user-stories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
      } satisfies GenerateUserStoriesRequest),
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeoutId);
    });

    logger.debug('Response received', {
      status: response.status,
      ok: response.ok,
    });

    const data: GenerateUserStoriesResponse = await response.json();

    if (!response.ok || !data.success) {
      logger.error('Error in API response', undefined, {
        error: data.error,
        status: response.status,
      });
      throw new UserStoriesGeneratorAPIError(
        data.error || `Failed to generate user stories (HTTP ${response.status})`,
        response.status
      );
    }

    if (!data.userStories) {
      logger.error('No user stories in response');
      throw new UserStoriesGeneratorAPIError(
        'No user stories returned from API',
        500
      );
    }

    logger.info('Successfully received user stories', {
      length: data.userStories.length,
    });
    return data.userStories;
  } catch (error) {
    logger.error('Exception in generateUserStories', error);
    // Re-throw our custom errors
    if (error instanceof UserStoriesGeneratorAPIError) {
      throw error;
    }

    // Wrap network errors and other exceptions
    throw new UserStoriesGeneratorAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

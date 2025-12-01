/**
 * Client-side API wrapper for LLM-based user story generation and operations
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '~/core/utils/logger';
import type { UserStory, UserStoryResponse } from './types';

export interface GenerateUserStoriesRequest {
  content: string;
}

export interface GenerateUserStoriesResponse {
  success: boolean;
  stories?: UserStoryResponse[];
  error?: string;
}

export interface CombineUserStoriesRequest {
  stories: UserStory[];
  instructions?: string;
}

export interface CombineUserStoriesResponse {
  success: boolean;
  story?: UserStoryResponse;
  error?: string;
}

export interface SplitUserStoryRequest {
  story: UserStory;
  instructions?: string;
}

export interface SplitUserStoryResponse {
  success: boolean;
  stories?: UserStoryResponse[];
  error?: string;
}

export interface RegenerateUserStoryRequest {
  story: UserStory;
  originalContent: string;
  instructions?: string;
}

export interface RegenerateUserStoryResponse {
  success: boolean;
  story?: UserStoryResponse;
  error?: string;
}

/**
 * Custom error class for user story API failures
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
 * Add client-generated IDs to user story responses
 */
function addIdsToStories(stories: UserStoryResponse[]): UserStory[] {
  return stories.map((story) => ({
    ...story,
    id: uuidv4(),
  }));
}

/**
 * Generate user stories with acceptance criteria using AWS Bedrock LLM
 *
 * @param content - Compiled design documentation (diagrams + documents)
 * @returns Promise that resolves to array of user stories with IDs
 * @throws UserStoriesGeneratorAPIError if generation fails
 */
export async function generateUserStories(content: string): Promise<UserStory[]> {
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

    if (!data.stories || data.stories.length === 0) {
      logger.error('No user stories in response');
      throw new UserStoriesGeneratorAPIError(
        'No user stories returned from API',
        500
      );
    }

    // Add client-generated IDs to the stories
    const storiesWithIds = addIdsToStories(data.stories);

    logger.info('Successfully received user stories', {
      count: storiesWithIds.length,
    });
    return storiesWithIds;
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

/**
 * Combine multiple user stories into one using AWS Bedrock LLM
 *
 * @param stories - Array of user stories to combine
 * @param instructions - Optional instructions for the combination
 * @returns Promise that resolves to a single combined user story with ID
 * @throws UserStoriesGeneratorAPIError if combination fails
 */
export async function combineUserStories(
  stories: UserStory[],
  instructions?: string
): Promise<UserStory> {
  logger.debug('combineUserStories called', {
    storyCount: stories.length,
    hasInstructions: !!instructions,
  });

  try {
    logger.info('Sending request to /api/user-stories/combine');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      logger.error('Request timeout after 120 seconds');
      controller.abort();
    }, 120000);

    const response = await fetch('/api/user-stories/combine', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stories,
        instructions,
      } satisfies CombineUserStoriesRequest),
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeoutId);
    });

    const data: CombineUserStoriesResponse = await response.json();

    if (!response.ok || !data.success) {
      throw new UserStoriesGeneratorAPIError(
        data.error || `Failed to combine user stories (HTTP ${response.status})`,
        response.status
      );
    }

    if (!data.story) {
      throw new UserStoriesGeneratorAPIError(
        'No combined story returned from API',
        500
      );
    }

    // Add client-generated ID to the combined story
    const storyWithId: UserStory = {
      ...data.story,
      id: uuidv4(),
    };

    logger.info('Successfully combined user stories');
    return storyWithId;
  } catch (error) {
    logger.error('Exception in combineUserStories', error);
    if (error instanceof UserStoriesGeneratorAPIError) {
      throw error;
    }
    throw new UserStoriesGeneratorAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

/**
 * Split a user story into multiple stories using AWS Bedrock LLM
 *
 * @param story - The user story to split
 * @param instructions - Optional instructions for the split
 * @returns Promise that resolves to an array of user stories with IDs
 * @throws UserStoriesGeneratorAPIError if split fails
 */
export async function splitUserStory(
  story: UserStory,
  instructions?: string
): Promise<UserStory[]> {
  logger.debug('splitUserStory called', {
    storyId: story.id,
    hasInstructions: !!instructions,
  });

  try {
    logger.info('Sending request to /api/user-stories/split');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      logger.error('Request timeout after 120 seconds');
      controller.abort();
    }, 120000);

    const response = await fetch('/api/user-stories/split', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        story,
        instructions,
      } satisfies SplitUserStoryRequest),
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeoutId);
    });

    const data: SplitUserStoryResponse = await response.json();

    if (!response.ok || !data.success) {
      throw new UserStoriesGeneratorAPIError(
        data.error || `Failed to split user story (HTTP ${response.status})`,
        response.status
      );
    }

    if (!data.stories || data.stories.length === 0) {
      throw new UserStoriesGeneratorAPIError(
        'No stories returned from split API',
        500
      );
    }

    // Add client-generated IDs to the split stories
    const storiesWithIds = addIdsToStories(data.stories);

    logger.info('Successfully split user story', {
      resultCount: storiesWithIds.length,
    });
    return storiesWithIds;
  } catch (error) {
    logger.error('Exception in splitUserStory', error);
    if (error instanceof UserStoriesGeneratorAPIError) {
      throw error;
    }
    throw new UserStoriesGeneratorAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

/**
 * Regenerate a user story using AWS Bedrock LLM
 *
 * @param story - The user story to regenerate
 * @param originalContent - The original design documentation
 * @param instructions - Optional instructions for regeneration
 * @returns Promise that resolves to the regenerated user story (preserves original ID)
 * @throws UserStoriesGeneratorAPIError if regeneration fails
 */
export async function regenerateUserStory(
  story: UserStory,
  originalContent: string,
  instructions?: string
): Promise<UserStory> {
  logger.debug('regenerateUserStory called', {
    storyId: story.id,
    hasInstructions: !!instructions,
  });

  try {
    logger.info('Sending request to /api/user-stories/regenerate');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      logger.error('Request timeout after 120 seconds');
      controller.abort();
    }, 120000);

    const response = await fetch('/api/user-stories/regenerate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        story,
        originalContent,
        instructions,
      } satisfies RegenerateUserStoryRequest),
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeoutId);
    });

    const data: RegenerateUserStoryResponse = await response.json();

    if (!response.ok || !data.success) {
      throw new UserStoriesGeneratorAPIError(
        data.error || `Failed to regenerate user story (HTTP ${response.status})`,
        response.status
      );
    }

    if (!data.story) {
      throw new UserStoriesGeneratorAPIError(
        'No story returned from regenerate API',
        500
      );
    }

    // Preserve the original ID
    const regeneratedStory: UserStory = {
      ...data.story,
      id: story.id,
    };

    logger.info('Successfully regenerated user story');
    return regeneratedStory;
  } catch (error) {
    logger.error('Exception in regenerateUserStory', error);
    if (error instanceof UserStoriesGeneratorAPIError) {
      throw error;
    }
    throw new UserStoriesGeneratorAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

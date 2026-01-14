/**
 * Client-side API wrapper for LLM-based user story generation and operations
 * Calls tinkersaur-api which proxies to tinkersaur-ai
 */

import { v4 as uuidv4 } from 'uuid';
import { httpClient, ApiError } from '~/core/api/httpClient';
import { logger } from '~/core/utils/logger';
import type { UserStory } from './types';

export interface GenerateUserStoriesResponse {
  success: boolean;
  stories?: Array<{ title: string; description: string; acceptanceCriteria: string }>;
  error?: string;
}

export interface CombineUserStoriesResponse {
  success: boolean;
  story?: { title: string; description: string; acceptanceCriteria: string };
  error?: string;
}

export interface SplitUserStoryResponse {
  success: boolean;
  stories?: Array<{ title: string; description: string; acceptanceCriteria: string }>;
  error?: string;
}

export interface RegenerateUserStoryResponse {
  success: boolean;
  story?: { title: string; description: string; acceptanceCriteria: string };
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
 * Convert API response to UserStory format
 */
function toUserStory(item: { title: string; description: string; acceptanceCriteria: string }): UserStory {
  const content = `## ${item.title}\n\n${item.description}\n\n### Acceptance Criteria\n\n${item.acceptanceCriteria}`;
  return { id: uuidv4(), content };
}

/**
 * Parse markdown content to extract structured data for API
 */
function parseStoryContent(content: string): { title: string; description: string; acceptanceCriteria: string } {
  const lines = content.split('\n');
  let title = '';
  let description = '';
  let acceptanceCriteria = '';
  let section = 'title';

  for (const line of lines) {
    if (line.startsWith('## ')) {
      title = line.replace('## ', '').trim();
      section = 'description';
    } else if (line.startsWith('### Acceptance Criteria')) {
      section = 'criteria';
    } else if (section === 'description') {
      description += line + '\n';
    } else if (section === 'criteria') {
      acceptanceCriteria += line + '\n';
    }
  }

  return {
    title: title || 'Untitled',
    description: description.trim(),
    acceptanceCriteria: acceptanceCriteria.trim(),
  };
}

/**
 * Generate user stories with acceptance criteria using AWS Bedrock LLM
 *
 * @param content - Compiled design documentation (diagrams + documents)
 * @param teamId - The team ID for authorization
 * @returns Promise that resolves to array of user stories with IDs
 * @throws UserStoriesGeneratorAPIError if generation fails
 */
export async function generateUserStories(content: string, teamId: string): Promise<UserStory[]> {
  logger.debug('generateUserStories called', {
    contentLength: content.length,
    teamId,
  });

  try {
    logger.info('Sending request to AI proxy endpoint');

    const data = await httpClient.post<GenerateUserStoriesResponse>(
      `/api/ai/generate-user-stories?teamId=${teamId}`,
      { content }
    );

    if (!data.success) {
      throw new UserStoriesGeneratorAPIError(
        data.error || 'Failed to generate user stories',
        500
      );
    }

    if (!data.stories || data.stories.length === 0) {
      throw new UserStoriesGeneratorAPIError(
        'No user stories returned from API',
        500
      );
    }

    const storiesWithIds = data.stories.map(toUserStory);

    logger.info('Successfully received user stories', {
      count: storiesWithIds.length,
    });
    return storiesWithIds;
  } catch (error) {
    logger.error('Exception in generateUserStories', error);

    if (error instanceof UserStoriesGeneratorAPIError) {
      throw error;
    }

    if (error instanceof ApiError) {
      throw new UserStoriesGeneratorAPIError(error.message, error.status);
    }

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
 * @param teamId - The team ID for authorization
 * @param instructions - Optional instructions for the combination
 * @returns Promise that resolves to a single combined user story with ID
 * @throws UserStoriesGeneratorAPIError if combination fails
 */
export async function combineUserStories(
  stories: UserStory[],
  teamId: string,
  instructions?: string
): Promise<UserStory> {
  logger.debug('combineUserStories called', {
    storyCount: stories.length,
    teamId,
    hasInstructions: !!instructions,
  });

  try {
    logger.info('Sending request to AI proxy endpoint');

    const storiesToSend = stories.map((s) => parseStoryContent(s.content));

    const data = await httpClient.post<CombineUserStoriesResponse>(
      `/api/ai/combine-stories?teamId=${teamId}`,
      { stories: storiesToSend, instructions }
    );

    if (!data.success) {
      throw new UserStoriesGeneratorAPIError(
        data.error || 'Failed to combine user stories',
        500
      );
    }

    if (!data.story) {
      throw new UserStoriesGeneratorAPIError(
        'No combined story returned from API',
        500
      );
    }

    const storyWithId = toUserStory(data.story);

    logger.info('Successfully combined user stories');
    return storyWithId;
  } catch (error) {
    logger.error('Exception in combineUserStories', error);

    if (error instanceof UserStoriesGeneratorAPIError) {
      throw error;
    }

    if (error instanceof ApiError) {
      throw new UserStoriesGeneratorAPIError(error.message, error.status);
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
 * @param teamId - The team ID for authorization
 * @param instructions - Optional instructions for the split
 * @returns Promise that resolves to an array of user stories with IDs
 * @throws UserStoriesGeneratorAPIError if split fails
 */
export async function splitUserStory(
  story: UserStory,
  teamId: string,
  instructions?: string
): Promise<UserStory[]> {
  logger.debug('splitUserStory called', {
    storyId: story.id,
    teamId,
    hasInstructions: !!instructions,
  });

  try {
    logger.info('Sending request to AI proxy endpoint');

    const storyToSend = parseStoryContent(story.content);

    const data = await httpClient.post<SplitUserStoryResponse>(
      `/api/ai/split-story?teamId=${teamId}`,
      { story: storyToSend, instructions }
    );

    if (!data.success) {
      throw new UserStoriesGeneratorAPIError(
        data.error || 'Failed to split user story',
        500
      );
    }

    if (!data.stories || data.stories.length === 0) {
      throw new UserStoriesGeneratorAPIError(
        'No stories returned from split API',
        500
      );
    }

    const storiesWithIds = data.stories.map(toUserStory);

    logger.info('Successfully split user story', {
      resultCount: storiesWithIds.length,
    });
    return storiesWithIds;
  } catch (error) {
    logger.error('Exception in splitUserStory', error);

    if (error instanceof UserStoriesGeneratorAPIError) {
      throw error;
    }

    if (error instanceof ApiError) {
      throw new UserStoriesGeneratorAPIError(error.message, error.status);
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
 * @param teamId - The team ID for authorization
 * @param instructions - Optional instructions for regeneration
 * @returns Promise that resolves to the regenerated user story (preserves original ID)
 * @throws UserStoriesGeneratorAPIError if regeneration fails
 */
export async function regenerateUserStory(
  story: UserStory,
  originalContent: string,
  teamId: string,
  instructions?: string
): Promise<UserStory> {
  logger.debug('regenerateUserStory called', {
    storyId: story.id,
    teamId,
    hasInstructions: !!instructions,
  });

  try {
    logger.info('Sending request to AI proxy endpoint');

    const storyToSend = parseStoryContent(story.content);

    const data = await httpClient.post<RegenerateUserStoryResponse>(
      `/api/ai/regenerate-story?teamId=${teamId}`,
      { story: storyToSend, originalContent, instructions }
    );

    if (!data.success) {
      throw new UserStoriesGeneratorAPIError(
        data.error || 'Failed to regenerate user story',
        500
      );
    }

    if (!data.story) {
      throw new UserStoriesGeneratorAPIError(
        'No story returned from regenerate API',
        500
      );
    }

    // Preserve the original ID, update content
    const regeneratedStory = toUserStory(data.story);
    regeneratedStory.id = story.id;

    logger.info('Successfully regenerated user story');
    return regeneratedStory;
  } catch (error) {
    logger.error('Exception in regenerateUserStory', error);

    if (error instanceof UserStoriesGeneratorAPIError) {
      throw error;
    }

    if (error instanceof ApiError) {
      throw new UserStoriesGeneratorAPIError(error.message, error.status);
    }

    throw new UserStoriesGeneratorAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

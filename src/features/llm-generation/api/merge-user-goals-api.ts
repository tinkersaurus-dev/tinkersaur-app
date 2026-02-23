/**
 * Client-side API wrapper for LLM-based user goal merging
 * Calls tinkersaur-api which proxies to tinkersaur-ai
 */

import { httpClient, ApiError } from '@/shared/api';
import { logger } from '@/shared/lib/utils';
import type { MergedUserGoalData, UserGoal } from '@/entities/user-goal';

export interface UserGoalInput {
  name: string;
  description: string;
}

export interface MergeUserGoalsResponse {
  success: boolean;
  useCase?: MergedUserGoalData;
  error?: string;
}

/**
 * Custom error class for user goal merge failures
 */
export class MergeUserGoalsAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'MergeUserGoalsAPIError';
  }
}

/**
 * Convert user goals to the input format expected by the API
 */
function toUserGoalInput(userGoal: UserGoal | UserGoalInput): UserGoalInput {
  return {
    name: userGoal.name,
    description: userGoal.description,
  };
}

/**
 * Merge multiple user goals using LLM
 *
 * @param userGoals - Array of user goals to merge
 * @param teamId - The team ID for authorization
 * @param instructions - Optional instructions for the merge
 * @returns Promise that resolves to the merged user goal data
 * @throws MergeUserGoalsAPIError if merge fails
 */
export async function mergeUserGoals(
  userGoals: (UserGoal | UserGoalInput)[],
  teamId: string,
  instructions?: string
): Promise<MergedUserGoalData> {
  logger.debug('mergeUserGoals called', {
    userGoalCount: userGoals.length,
    teamId,
    hasInstructions: !!instructions,
  });

  try {
    const userGoalInputs = userGoals.map(toUserGoalInput);

    // Reuses the merge-use-cases AI endpoint — it only needs name/description
    const data = await httpClient.post<MergeUserGoalsResponse>(
      `/api/ai/merge-use-cases?teamId=${teamId}`,
      {
        useCases: userGoalInputs,
        ...(instructions && { instructions }),
      }
    );

    if (!data.success) {
      throw new MergeUserGoalsAPIError(
        data.error || 'Failed to merge user goals',
        500
      );
    }

    if (!data.useCase) {
      throw new MergeUserGoalsAPIError(
        'No merged user goal returned from API',
        500
      );
    }

    return data.useCase;
  } catch (error) {
    logger.error('Exception in mergeUserGoals', error);

    if (error instanceof MergeUserGoalsAPIError) {
      throw error;
    }

    if (error instanceof ApiError) {
      throw new MergeUserGoalsAPIError(error.message, error.status);
    }

    throw new MergeUserGoalsAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

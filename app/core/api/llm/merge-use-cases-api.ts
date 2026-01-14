/**
 * Client-side API wrapper for LLM-based use case merging
 * Calls tinkersaur-api which proxies to tinkersaur-ai
 */

import { httpClient, ApiError } from '~/core/api/httpClient';
import { logger } from '~/core/utils/logger';
import type { MergedUseCaseData, UseCase } from '~/core/entities/product-management/types';

export interface UseCaseInput {
  name: string;
  description: string;
}

export interface MergeUseCasesResponse {
  success: boolean;
  useCase?: MergedUseCaseData;
  error?: string;
}

/**
 * Custom error class for use case merge failures
 */
export class MergeUseCasesAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'MergeUseCasesAPIError';
  }
}

/**
 * Convert use cases to the input format expected by the API
 */
function toUseCaseInput(useCase: UseCase | UseCaseInput): UseCaseInput {
  return {
    name: useCase.name,
    description: useCase.description,
  };
}

/**
 * Merge multiple use cases using AWS Bedrock LLM
 *
 * @param useCases - Array of use cases to merge
 * @param teamId - The team ID for authorization
 * @param instructions - Optional instructions for the merge
 * @returns Promise that resolves to the merged use case data
 * @throws MergeUseCasesAPIError if merge fails
 */
export async function mergeUseCases(
  useCases: (UseCase | UseCaseInput)[],
  teamId: string,
  instructions?: string
): Promise<MergedUseCaseData> {
  logger.debug('mergeUseCases called', {
    useCaseCount: useCases.length,
    teamId,
    hasInstructions: !!instructions,
  });

  try {
    const useCaseInputs = useCases.map(toUseCaseInput);

    const data = await httpClient.post<MergeUseCasesResponse>(
      `/api/ai/merge-use-cases?teamId=${teamId}`,
      {
        useCases: useCaseInputs,
        ...(instructions && { instructions }),
      }
    );

    if (!data.success) {
      throw new MergeUseCasesAPIError(
        data.error || 'Failed to merge use cases',
        500
      );
    }

    if (!data.useCase) {
      throw new MergeUseCasesAPIError(
        'No merged use case returned from API',
        500
      );
    }

    return data.useCase;
  } catch (error) {
    logger.error('Exception in mergeUseCases', error);

    if (error instanceof MergeUseCasesAPIError) {
      throw error;
    }

    if (error instanceof ApiError) {
      throw new MergeUseCasesAPIError(error.message, error.status);
    }

    throw new MergeUseCasesAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

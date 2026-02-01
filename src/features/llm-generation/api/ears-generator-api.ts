/**
 * Client-side API wrapper for EARS requirement generation
 * Calls tinkersaur-api which proxies to tinkersaur-ai
 */

import { httpClient, ApiError } from '@/shared/api';
import { logger } from '@/shared/lib/utils';
import type { RequirementType } from '@/entities/requirement';

export interface GenerateEarsResponse {
  success: boolean;
  result?: {
    text: string;
    type: string;  // 'functional' | 'non-functional' | 'constraint'
  };
  error?: string;
}

export interface EarsGenerationResult {
  text: string;
  type: RequirementType;
}

/**
 * Custom error class for EARS generation failures
 */
export class EarsGenerationAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'EarsGenerationAPIError';
  }
}

/**
 * Generate an EARS-formatted requirement from informal text
 *
 * @param text - The informal requirement text to convert
 * @param teamId - The team ID for authorization
 * @returns Promise that resolves to the EARS-formatted requirement and its type
 * @throws EarsGenerationAPIError if generation fails
 */
export async function generateEarsRequirement(
  text: string,
  teamId: string
): Promise<EarsGenerationResult> {
  logger.debug('generateEarsRequirement called', { textLength: text.length, teamId });

  try {
    const data = await httpClient.post<GenerateEarsResponse>(
      `/api/ai/generate-ears-requirement?teamId=${teamId}`,
      { text }
    );

    if (!data.success) {
      throw new EarsGenerationAPIError(
        data.error || 'Failed to generate EARS requirement',
        500
      );
    }

    if (!data.result) {
      throw new EarsGenerationAPIError(
        'No result returned from API',
        500
      );
    }

    // Map string type to RequirementType
    const typeMapping: Record<string, RequirementType> = {
      'functional': 'functional',
      'non-functional': 'non-functional',
      'constraint': 'constraint',
    };

    return {
      text: data.result.text,
      type: typeMapping[data.result.type] || 'functional',
    };
  } catch (error) {
    logger.error('Exception in generateEarsRequirement', error);

    if (error instanceof EarsGenerationAPIError) {
      throw error;
    }

    if (error instanceof ApiError) {
      throw new EarsGenerationAPIError(error.message, error.status);
    }

    throw new EarsGenerationAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

/**
 * Client-side API wrapper for LLM-based transcript parsing
 * Calls tinkersaur-api which proxies to tinkersaur-ai
 */

import { httpClient, ApiError } from '@/shared/api';
import { logger } from '@/shared/lib/utils';
import type { SourceTypeKey } from '@/entities/source-type';
import type { IntakeResult, ParseTranscriptResponse } from '@/entities/intake-result';

/**
 * Custom error class for transcript parsing failures
 */
export class ParseTranscriptAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'ParseTranscriptAPIError';
  }
}

/**
 * Parse a transcript using AWS Bedrock LLM
 *
 * @param sourceType - The type of source document
 * @param content - The transcript content to parse
 * @param metadata - Additional metadata about the source
 * @param teamId - The team ID for authorization
 * @returns Promise that resolves to the parsed intake result
 * @throws ParseTranscriptAPIError if parsing fails
 */
export async function parseTranscript(
  sourceType: SourceTypeKey,
  content: string,
  metadata: Record<string, string>,
  teamId: string
): Promise<IntakeResult> {
  logger.debug('parseTranscript called', {
    sourceType,
    contentLength: content.length,
    teamId,
  });

  try {
    const data = await httpClient.post<ParseTranscriptResponse>(
      `/api/ai/parse-transcript?teamId=${teamId}`,
      { sourceType, content, metadata }
    );

    // Debug logging to diagnose parsing issues
    logger.info('Raw API response received', {
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
      success: data?.success,
      hasResult: !!data?.result,
      resultKeys: data?.result ? Object.keys(data.result) : [],
      error: data?.error,
      rawDataPreview: JSON.stringify(data).substring(0, 500),
    });

    if (!data.success || !data.result) {
      logger.error('Parse transcript validation failed', {
        success: data?.success,
        hasResult: !!data?.result,
        error: data?.error,
        fullResponse: JSON.stringify(data),
      });
      throw new ParseTranscriptAPIError(
        data.error || 'Failed to parse transcript',
        500
      );
    }

    logger.info('Successfully parsed transcript', {
      personaCount: data.result.personas?.length ?? 0,
      userGoalCount: data.result.userGoals?.length ?? 0,
    });
    return data.result;
  } catch (error) {
    logger.error('Exception in parseTranscript', error);

    if (error instanceof ParseTranscriptAPIError) {
      throw error;
    }

    if (error instanceof ApiError) {
      throw new ParseTranscriptAPIError(error.message, error.status);
    }

    throw new ParseTranscriptAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

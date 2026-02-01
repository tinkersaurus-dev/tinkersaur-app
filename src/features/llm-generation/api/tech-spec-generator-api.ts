/**
 * Client-side API wrapper for LLM-based technical specification generation
 * Calls tinkersaur-api which proxies to tinkersaur-ai
 */

import { v4 as uuidv4 } from 'uuid';
import { httpClient, ApiError } from '@/shared/api';
import { logger } from '@/shared/lib/utils';
import type {
  TechSpecSection,
  TechSpecSectionResponse,
  TechSpecSectionType,
  GenerateTechSpecAPIResponse,
  TechSpecOperationResponse,
} from '../model/types';

/**
 * Custom error class for technical specification generation failures
 */
export class TechSpecGeneratorAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'TechSpecGeneratorAPIError';
  }
}

/**
 * Add client-generated IDs to tech spec section responses
 */
function addIdsToSections(sections: TechSpecSectionResponse[]): TechSpecSection[] {
  return sections.map((section) => ({
    ...section,
    id: uuidv4(),
    sectionType: section.sectionType as TechSpecSectionType,
  }));
}

/**
 * Generate structured technical specification using AWS Bedrock LLM
 * Returns multiple sections, each covering a specific aspect of the specification
 *
 * @param content - Compiled design documentation (diagrams + documents)
 * @param teamId - The team ID for authorization
 * @returns Promise that resolves to an array of tech spec sections
 * @throws TechSpecGeneratorAPIError if generation fails
 */
export async function generateTechSpecStructured(content: string, teamId: string): Promise<TechSpecSection[]> {
  logger.debug('generateTechSpecStructured called', {
    contentLength: content.length,
    teamId,
  });

  try {
    const data = await httpClient.post<GenerateTechSpecAPIResponse>(
      `/api/ai/generate-tech-spec?teamId=${teamId}`,
      { content }
    );

    if (!data.success) {
      throw new TechSpecGeneratorAPIError(
        data.error || 'Failed to generate technical specification',
        500
      );
    }

    if (!data.sections || data.sections.length === 0) {
      throw new TechSpecGeneratorAPIError(
        'No sections returned from API',
        500
      );
    }

    const sectionsWithIds = addIdsToSections(data.sections);

    return sectionsWithIds;
  } catch (error) {
    logger.error('Exception in generateTechSpecStructured', error);

    if (error instanceof TechSpecGeneratorAPIError) {
      throw error;
    }

    if (error instanceof ApiError) {
      throw new TechSpecGeneratorAPIError(error.message, error.status);
    }

    throw new TechSpecGeneratorAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

/**
 * Regenerate a tech spec section with optional instructions
 *
 * @param section - The section to regenerate
 * @param originalContent - The original design documentation
 * @param teamId - The team ID for authorization
 * @param instructions - Optional instructions for regeneration
 * @returns Promise that resolves to the regenerated section (with original ID preserved)
 * @throws TechSpecGeneratorAPIError if regeneration fails
 */
export async function regenerateTechSpecSection(
  section: TechSpecSection,
  originalContent: string,
  teamId: string,
  instructions?: string
): Promise<TechSpecSection> {
  logger.debug('regenerateTechSpecSection called', {
    sectionId: section.id,
    sectionType: section.sectionType,
    teamId,
    contentLength: originalContent.length,
    hasInstructions: !!instructions,
  });

  try {
    const data = await httpClient.post<TechSpecOperationResponse>(
      `/api/ai/regenerate-tech-spec?teamId=${teamId}`,
      { section, originalContent, instructions }
    );

    if (!data.success) {
      throw new TechSpecGeneratorAPIError(
        data.error || 'Failed to regenerate section',
        500
      );
    }

    if (!data.section) {
      throw new TechSpecGeneratorAPIError(
        'No section returned from API',
        500
      );
    }

    // Preserve the original ID
    const regeneratedSection: TechSpecSection = {
      ...data.section,
      id: section.id,
      sectionType: data.section.sectionType as TechSpecSectionType,
    };

    logger.info('Successfully regenerated section', {
      sectionId: regeneratedSection.id,
      sectionType: regeneratedSection.sectionType,
    });
    return regeneratedSection;
  } catch (error) {
    logger.error('Exception in regenerateTechSpecSection', error);

    if (error instanceof TechSpecGeneratorAPIError) {
      throw error;
    }

    if (error instanceof ApiError) {
      throw new TechSpecGeneratorAPIError(error.message, error.status);
    }

    throw new TechSpecGeneratorAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

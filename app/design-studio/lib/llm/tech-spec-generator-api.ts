/**
 * Client-side API wrapper for LLM-based technical specification generation
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '~/core/utils/logger';
import type {
  TechSpecSection,
  TechSpecSectionResponse,
  TechSpecSectionType,
  GenerateTechSpecAPIResponse,
  TechSpecOperationResponse,
} from './types';

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
 * @returns Promise that resolves to an array of tech spec sections
 * @throws TechSpecGeneratorAPIError if generation fails
 */
export async function generateTechSpecStructured(content: string): Promise<TechSpecSection[]> {
  logger.debug('generateTechSpecStructured called', {
    contentLength: content.length,
  });

  try {
    logger.info('Sending request to /api/generate-tech-spec-structured');

    // Create an AbortController with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      logger.error('Request timeout after 120 seconds');
      controller.abort();
    }, 120000);

    const response = await fetch('/api/generate-tech-spec-structured', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeoutId);
    });

    logger.debug('Response received', {
      status: response.status,
      ok: response.ok,
    });

    const data: GenerateTechSpecAPIResponse = await response.json();

    if (!response.ok || !data.success) {
      logger.error('Error in API response', undefined, {
        error: data.error,
        status: response.status,
      });
      throw new TechSpecGeneratorAPIError(
        data.error || `Failed to generate technical specification (HTTP ${response.status})`,
        response.status
      );
    }

    if (!data.sections || data.sections.length === 0) {
      logger.error('No sections in response');
      throw new TechSpecGeneratorAPIError(
        'No sections returned from API',
        500
      );
    }

    // Add client-generated IDs
    const sectionsWithIds = addIdsToSections(data.sections);

    logger.info('Successfully received tech spec sections', {
      count: sectionsWithIds.length,
    });
    return sectionsWithIds;
  } catch (error) {
    logger.error('Exception in generateTechSpecStructured', error);
    // Re-throw our custom errors
    if (error instanceof TechSpecGeneratorAPIError) {
      throw error;
    }

    // Wrap network errors and other exceptions
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
 * @param instructions - Optional instructions for regeneration
 * @returns Promise that resolves to the regenerated section (with original ID preserved)
 * @throws TechSpecGeneratorAPIError if regeneration fails
 */
export async function regenerateTechSpecSection(
  section: TechSpecSection,
  originalContent: string,
  instructions?: string
): Promise<TechSpecSection> {
  logger.debug('regenerateTechSpecSection called', {
    sectionId: section.id,
    sectionType: section.sectionType,
    contentLength: originalContent.length,
    hasInstructions: !!instructions,
  });

  try {
    logger.info('Sending request to /api/tech-spec/regenerate');

    // Create an AbortController with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      logger.error('Request timeout after 120 seconds');
      controller.abort();
    }, 120000);

    const response = await fetch('/api/tech-spec/regenerate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        section,
        originalContent,
        instructions,
      }),
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeoutId);
    });

    logger.debug('Response received', {
      status: response.status,
      ok: response.ok,
    });

    const data: TechSpecOperationResponse = await response.json();

    if (!response.ok || !data.success) {
      logger.error('Error in API response', undefined, {
        error: data.error,
        status: response.status,
      });
      throw new TechSpecGeneratorAPIError(
        data.error || `Failed to regenerate section (HTTP ${response.status})`,
        response.status
      );
    }

    if (!data.section) {
      logger.error('No section in response');
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
    // Re-throw our custom errors
    if (error instanceof TechSpecGeneratorAPIError) {
      throw error;
    }

    // Wrap network errors and other exceptions
    throw new TechSpecGeneratorAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

/**
 * Client-side API wrapper for LLM-based user documentation generation
 * Calls tinkersaur-api which proxies to tinkersaur-ai
 */

import { v4 as uuidv4 } from 'uuid';
import { httpClient, ApiError } from '@/shared/api';
import { logger } from '@/shared/lib/utils';
import {
  userDocumentsToMarkdown,
  type UserDocument,
  type UserDocumentResponse,
  type GenerateUserDocsAPIResponse,
  type UserDocOperationResponse,
} from '../model/types';

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
 * Add client-generated IDs to user document responses
 */
function addIdsToDocuments(documents: UserDocumentResponse[]): UserDocument[] {
  return documents.map((doc) => ({
    ...doc,
    id: uuidv4(),
  }));
}

/**
 * Generate user documentation using AWS Bedrock LLM
 *
 * @param content - Compiled design documentation (diagrams + documents)
 * @param teamId - The team ID for authorization
 * @returns Promise that resolves to the generated user documentation markdown
 * @throws UserDocsGeneratorAPIError if generation fails
 */
export async function generateUserDocs(content: string, teamId: string): Promise<string> {
  logger.debug('generateUserDocs called', {
    contentLength: content.length,
    teamId,
  });

  try {
    const data = await httpClient.post<GenerateUserDocsAPIResponse>(
      `/api/ai/generate-user-docs?teamId=${teamId}`,
      { content }
    );

    if (!data.success) {
      throw new UserDocsGeneratorAPIError(
        data.error || 'Failed to generate user documentation',
        500
      );
    }

    if (!data.documents || data.documents.length === 0) {
      throw new UserDocsGeneratorAPIError(
        'No documents returned from API',
        500
      );
    }

    // For backwards compatibility, combine all documents into a single markdown string
    const documentsWithIds = addIdsToDocuments(data.documents);
    const markdown = userDocumentsToMarkdown(documentsWithIds);

    return markdown;
  } catch (error) {
    logger.error('Exception in generateUserDocs', error);

    if (error instanceof UserDocsGeneratorAPIError) {
      throw error;
    }

    if (error instanceof ApiError) {
      throw new UserDocsGeneratorAPIError(error.message, error.status);
    }

    throw new UserDocsGeneratorAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

/**
 * Generate structured user documents using AWS Bedrock LLM
 * Returns multiple documents, each representing a distinct user process
 *
 * @param content - Compiled design documentation (diagrams + documents)
 * @param teamId - The team ID for authorization
 * @returns Promise that resolves to an array of user documents
 * @throws UserDocsGeneratorAPIError if generation fails
 */
export async function generateUserDocsStructured(content: string, teamId: string): Promise<UserDocument[]> {
  logger.debug('generateUserDocsStructured called', {
    contentLength: content.length,
    teamId,
  });

  try {
    const data = await httpClient.post<GenerateUserDocsAPIResponse>(
      `/api/ai/generate-user-docs?teamId=${teamId}`,
      { content }
    );

    if (!data.success) {
      throw new UserDocsGeneratorAPIError(
        data.error || 'Failed to generate user documentation',
        500
      );
    }

    if (!data.documents || data.documents.length === 0) {
      throw new UserDocsGeneratorAPIError(
        'No documents returned from API',
        500
      );
    }

    const documentsWithIds = addIdsToDocuments(data.documents);

    return documentsWithIds;
  } catch (error) {
    logger.error('Exception in generateUserDocsStructured', error);

    if (error instanceof UserDocsGeneratorAPIError) {
      throw error;
    }

    if (error instanceof ApiError) {
      throw new UserDocsGeneratorAPIError(error.message, error.status);
    }

    throw new UserDocsGeneratorAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

/**
 * Regenerate a user document with optional instructions
 *
 * @param document - The document to regenerate
 * @param originalContent - The original design documentation
 * @param teamId - The team ID for authorization
 * @param instructions - Optional instructions for regeneration
 * @returns Promise that resolves to the regenerated document (with original ID preserved)
 * @throws UserDocsGeneratorAPIError if regeneration fails
 */
export async function regenerateUserDocument(
  document: UserDocument,
  originalContent: string,
  teamId: string,
  instructions?: string
): Promise<UserDocument> {
  logger.debug('regenerateUserDocument called', {
    documentId: document.id,
    teamId,
    contentLength: originalContent.length,
    hasInstructions: !!instructions,
  });

  try {
    const data = await httpClient.post<UserDocOperationResponse>(
      `/api/ai/regenerate-user-doc?teamId=${teamId}`,
      { document, originalContent, instructions }
    );

    if (!data.success) {
      throw new UserDocsGeneratorAPIError(
        data.error || 'Failed to regenerate document',
        500
      );
    }

    if (!data.document) {
      throw new UserDocsGeneratorAPIError(
        'No document returned from API',
        500
      );
    }

    // Preserve the original ID
    const regeneratedDocument: UserDocument = {
      ...data.document,
      id: document.id,
    };

    logger.info('Successfully regenerated document', {
      documentId: regeneratedDocument.id,
    });
    return regeneratedDocument;
  } catch (error) {
    logger.error('Exception in regenerateUserDocument', error);

    if (error instanceof UserDocsGeneratorAPIError) {
      throw error;
    }

    if (error instanceof ApiError) {
      throw new UserDocsGeneratorAPIError(error.message, error.status);
    }

    throw new UserDocsGeneratorAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

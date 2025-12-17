/**
 * Client-side API wrapper for LLM-based user documentation generation
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '~/core/utils/logger';
import type {
  UserDocument,
  UserDocumentResponse,
  GenerateUserDocsAPIResponse,
  UserDocOperationResponse,
} from './types';

export interface GenerateUserDocsRequest {
  content: string;
}

export interface GenerateUserDocsResponse {
  success: boolean;
  userDocs?: string;
  error?: string;
}

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
 * Generate user documentation using AWS Bedrock LLM
 *
 * @param content - Compiled design documentation (diagrams + documents)
 * @returns Promise that resolves to the generated user documentation markdown
 * @throws UserDocsGeneratorAPIError if generation fails
 */
export async function generateUserDocs(content: string): Promise<string> {
  logger.debug('generateUserDocs called', {
    contentLength: content.length,
  });

  try {
    logger.info('Sending request to /api/generate-user-docs');

    // Create an AbortController with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      logger.error('Request timeout after 120 seconds');
      controller.abort();
    }, 120000);

    const response = await fetch('/api/generate-user-docs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
      } satisfies GenerateUserDocsRequest),
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeoutId);
    });

    logger.debug('Response received', {
      status: response.status,
      ok: response.ok,
    });

    const data: GenerateUserDocsResponse = await response.json();

    if (!response.ok || !data.success) {
      logger.error('Error in API response', undefined, {
        error: data.error,
        status: response.status,
      });
      throw new UserDocsGeneratorAPIError(
        data.error || `Failed to generate user documentation (HTTP ${response.status})`,
        response.status
      );
    }

    if (!data.userDocs) {
      logger.error('No user documentation in response');
      throw new UserDocsGeneratorAPIError(
        'No user documentation returned from API',
        500
      );
    }

    logger.info('Successfully received user documentation', {
      length: data.userDocs.length,
    });
    return data.userDocs;
  } catch (error) {
    logger.error('Exception in generateUserDocs', error);
    // Re-throw our custom errors
    if (error instanceof UserDocsGeneratorAPIError) {
      throw error;
    }

    // Wrap network errors and other exceptions
    throw new UserDocsGeneratorAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

// ============================================================================
// Structured User Documentation API (Multi-Document)
// ============================================================================

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
 * Generate structured user documents using AWS Bedrock LLM
 * Returns multiple documents, each representing a distinct user process
 *
 * @param content - Compiled design documentation (diagrams + documents)
 * @returns Promise that resolves to an array of user documents
 * @throws UserDocsGeneratorAPIError if generation fails
 */
export async function generateUserDocsStructured(content: string): Promise<UserDocument[]> {
  logger.debug('generateUserDocsStructured called', {
    contentLength: content.length,
  });

  try {
    logger.info('Sending request to /api/generate-user-docs-structured');

    // Create an AbortController with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      logger.error('Request timeout after 120 seconds');
      controller.abort();
    }, 120000);

    const response = await fetch('/api/generate-user-docs-structured', {
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

    const data: GenerateUserDocsAPIResponse = await response.json();

    if (!response.ok || !data.success) {
      logger.error('Error in API response', undefined, {
        error: data.error,
        status: response.status,
      });
      throw new UserDocsGeneratorAPIError(
        data.error || `Failed to generate user documentation (HTTP ${response.status})`,
        response.status
      );
    }

    if (!data.documents || data.documents.length === 0) {
      logger.error('No documents in response');
      throw new UserDocsGeneratorAPIError(
        'No documents returned from API',
        500
      );
    }

    // Add client-generated IDs
    const documentsWithIds = addIdsToDocuments(data.documents);

    logger.info('Successfully received user documents', {
      count: documentsWithIds.length,
    });
    return documentsWithIds;
  } catch (error) {
    logger.error('Exception in generateUserDocsStructured', error);
    // Re-throw our custom errors
    if (error instanceof UserDocsGeneratorAPIError) {
      throw error;
    }

    // Wrap network errors and other exceptions
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
 * @param instructions - Optional instructions for regeneration
 * @returns Promise that resolves to the regenerated document (with original ID preserved)
 * @throws UserDocsGeneratorAPIError if regeneration fails
 */
export async function regenerateUserDocument(
  document: UserDocument,
  originalContent: string,
  instructions?: string
): Promise<UserDocument> {
  logger.debug('regenerateUserDocument called', {
    documentId: document.id,
    contentLength: originalContent.length,
    hasInstructions: !!instructions,
  });

  try {
    logger.info('Sending request to /api/generate-user-docs-regenerate');

    // Create an AbortController with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      logger.error('Request timeout after 120 seconds');
      controller.abort();
    }, 120000);

    const response = await fetch('/api/generate-user-docs-regenerate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document,
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

    const data: UserDocOperationResponse = await response.json();

    if (!response.ok || !data.success) {
      logger.error('Error in API response', undefined, {
        error: data.error,
        status: response.status,
      });
      throw new UserDocsGeneratorAPIError(
        data.error || `Failed to regenerate document (HTTP ${response.status})`,
        response.status
      );
    }

    if (!data.document) {
      logger.error('No document in response');
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
    // Re-throw our custom errors
    if (error instanceof UserDocsGeneratorAPIError) {
      throw error;
    }

    // Wrap network errors and other exceptions
    throw new UserDocsGeneratorAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

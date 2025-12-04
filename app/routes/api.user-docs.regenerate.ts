/**
 * React Router API Route for regenerating a user document using Amazon Bedrock
 * Uses AWS SDK with bearer token authentication
 * Returns a single regenerated document as structured JSON
 */

import type { ActionFunctionArgs } from 'react-router';
import { getSystemPrompt } from '~/design-studio/lib/llm/system-prompts';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  type InvokeModelCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';
import { logger } from '~/core/utils/logger';
import type { UserDocument, UserDocumentResponse } from '~/design-studio/lib/llm/types';

// Type definitions for Bedrock API responses
interface BedrockMessageContent {
  text: string;
}

interface BedrockMessage {
  content: BedrockMessageContent[];
}

interface BedrockOutput {
  message: BedrockMessage;
  text?: string;
}

interface BedrockResponseBody {
  choices?: Array<{ message?: { content?: string } }>;
  content?: BedrockMessageContent[];
  output?: BedrockOutput;
  text?: string;
}

// Bedrock configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'qwen.qwen3-coder-30b-a3b-v1:0';
const BEARER_TOKEN = process.env.AWS_BEARER_TOKEN_BEDROCK;

// Create credentials object
const credentials = BEARER_TOKEN
  ? {
      accessKeyId: '',
      secretAccessKey: '',
      sessionToken: BEARER_TOKEN,
    }
  : {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    };

const client = new BedrockRuntimeClient({
  region: AWS_REGION,
  credentials,
});

export async function action({ request }: ActionFunctionArgs) {
  logger.apiRequest(request.method, '/api/user-docs/regenerate');

  try {
    const body = await request.json();
    const { document, originalContent, instructions } = body as {
      document: UserDocument;
      originalContent: string;
      instructions?: string;
    };

    logger.debug('Request received', {
      documentId: document?.id,
      contentLength: originalContent?.length,
      hasInstructions: !!instructions,
    });

    // Validate input
    if (!document || !document.title || !document.overview) {
      logger.warn('Validation error: invalid document structure');
      return Response.json(
        {
          success: false,
          error: 'A valid document is required for regeneration',
        },
        { status: 400 }
      );
    }

    if (!originalContent || typeof originalContent !== 'string' || originalContent.trim().length === 0) {
      logger.warn('Validation error: empty original content');
      return Response.json(
        {
          success: false,
          error: 'Original content is required for regeneration',
        },
        { status: 400 }
      );
    }

    // Get regenerate system prompt
    const systemPrompt = getSystemPrompt('user-documentation-regenerate');

    // Prepare the request for the model
    let userMessage = `Regenerate and improve the following user documentation based on the original design documentation.\n\n`;
    userMessage += `Current Document:\n${JSON.stringify(document, null, 2)}\n\n`;
    userMessage += `Original Design Documentation:\n${originalContent}`;

    if (instructions) {
      userMessage += `\n\nAdditional instructions: ${instructions}`;
    }

    const bedrockRequest = {
      system: [{ text: systemPrompt }],
      messages: [
        {
          role: 'user',
          content: [{ text: userMessage }],
        },
      ],
      inferenceConfig: {
        maxTokens: 4096,
        temperature: 0.7,
        topP: 0.9,
      },
    };

    logger.debug('Bedrock request prepared', {
      modelId: MODEL_ID,
      region: AWS_REGION,
      usingBearerToken: !!BEARER_TOKEN,
    });

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(bedrockRequest),
    });

    // Call Bedrock with timeout
    logger.info('Sending request to Bedrock for document regeneration');

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Bedrock request timed out after 120 seconds'));
      }, 120000);
    });

    const response = (await Promise.race([
      client.send(command),
      timeoutPromise,
    ])) as InvokeModelCommandOutput;

    logger.info('Bedrock response received', {
      statusCode: response.$metadata.httpStatusCode,
    });

    // Parse the response
    const responseBody: BedrockResponseBody = JSON.parse(
      new TextDecoder().decode(response.body)
    );

    // Extract regenerated document from response
    const regeneratedDoc =
      responseBody.choices?.[0]?.message?.content ||
      responseBody.content?.[0]?.text ||
      responseBody.output?.text ||
      responseBody.text ||
      responseBody.output?.message?.content?.[0]?.text ||
      '';

    logger.debug('Extracted regenerated document', { length: regeneratedDoc.length });

    if (!regeneratedDoc) {
      logger.error('Failed to extract regenerated document from response');
      return Response.json(
        {
          success: false,
          error: 'No regenerated document generated from the model.',
        },
        { status: 500 }
      );
    }

    // Clean up and parse JSON
    let cleanedDoc = regeneratedDoc.trim();

    // Remove markdown code blocks if present
    if (cleanedDoc.startsWith('```json')) {
      cleanedDoc = cleanedDoc.slice(7);
    } else if (cleanedDoc.startsWith('```')) {
      cleanedDoc = cleanedDoc.slice(3);
    }
    if (cleanedDoc.endsWith('```')) {
      cleanedDoc = cleanedDoc.slice(0, -3);
    }
    cleanedDoc = cleanedDoc.trim();

    // Parse the JSON response
    let parsedDoc: UserDocumentResponse;
    try {
      parsedDoc = JSON.parse(cleanedDoc);
    } catch (parseError) {
      logger.error('Failed to parse regenerated document JSON', parseError, {
        rawResponse: cleanedDoc.substring(0, 500),
      });
      return Response.json(
        {
          success: false,
          error: 'Failed to parse regenerated document response as JSON',
        },
        { status: 500 }
      );
    }

    // Validate the structure
    if (!parsedDoc.title || !parsedDoc.overview) {
      logger.error('Invalid regenerated document structure', undefined, {
        hasTitle: !!parsedDoc.title,
        hasOverview: !!parsedDoc.overview,
      });
      return Response.json(
        {
          success: false,
          error: 'Invalid regenerated document structure in response',
        },
        { status: 500 }
      );
    }

    logger.info('Successfully regenerated user document');
    return Response.json({
      success: true,
      document: parsedDoc,
    });
  } catch (error) {
    logger.apiError(request.method, '/api/user-docs/regenerate', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return Response.json(
      {
        success: false,
        error: `Failed to regenerate user document: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

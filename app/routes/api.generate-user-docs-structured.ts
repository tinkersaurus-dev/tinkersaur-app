/**
 * React Router API Route for generating structured user documentation using Amazon Bedrock
 * Returns multiple documents as structured JSON for interactive editing
 */

import type { ActionFunctionArgs } from 'react-router';
import { getSystemPrompt } from '~/design-studio/lib/llm/system-prompts';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  type InvokeModelCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';
import { logger } from '~/core/utils/logger';
import type { UserDocumentResponse } from '~/design-studio/lib/llm/types';

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
  logger.apiRequest(request.method, '/api/generate-user-docs-structured');

  try {
    const body = await request.json();
    const { content } = body;

    logger.debug('Request received', {
      contentLength: content?.length,
    });

    // Validate input
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      logger.warn('Validation error: empty content');
      return Response.json(
        {
          success: false,
          error: 'Content is required and must be a non-empty string',
        },
        { status: 400 }
      );
    }

    // Get structured user documentation system prompt
    const systemPrompt = getSystemPrompt('user-documentation-structured');

    // Prepare the request for the model
    const userMessage = `Generate user documentation as structured JSON from the following design documentation. Identify distinct user processes and create a separate document for each:\n\n${content}`;

    const bedrockRequest = {
      system: [{ text: systemPrompt }],
      messages: [
        {
          role: 'user',
          content: [{ text: userMessage }],
        },
      ],
      inferenceConfig: {
        maxTokens: 8192,
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
    logger.info('Sending request to Bedrock for user documentation generation');

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

    logger.debug('Response body parsed', {
      hasChoices: !!responseBody.choices,
      hasContent: !!responseBody.content,
      hasOutput: !!responseBody.output,
    });

    // Extract generated documents from response
    const generatedDocs =
      responseBody.choices?.[0]?.message?.content ||
      responseBody.content?.[0]?.text ||
      responseBody.output?.text ||
      responseBody.text ||
      responseBody.output?.message?.content?.[0]?.text ||
      '';

    logger.debug('Extracted user documentation', { length: generatedDocs.length });

    if (!generatedDocs) {
      logger.error('Failed to extract user documentation from response', undefined, {
        hasChoices: !!responseBody.choices,
        hasContent: !!responseBody.content,
        hasOutput: !!responseBody.output,
      });
      return Response.json(
        {
          success: false,
          error: 'No user documentation generated from the model. Check server logs for details.',
        },
        { status: 500 }
      );
    }

    // Clean up the generated content and parse JSON
    let cleanedDocs = generatedDocs.trim();

    // Remove markdown code blocks if present
    if (cleanedDocs.startsWith('```json')) {
      cleanedDocs = cleanedDocs.slice(7);
    } else if (cleanedDocs.startsWith('```')) {
      cleanedDocs = cleanedDocs.slice(3);
    }
    if (cleanedDocs.endsWith('```')) {
      cleanedDocs = cleanedDocs.slice(0, -3);
    }
    cleanedDocs = cleanedDocs.trim();

    // Parse the JSON response
    let parsedDocs: { documents: UserDocumentResponse[] };
    try {
      parsedDocs = JSON.parse(cleanedDocs);
    } catch (parseError) {
      logger.error('Failed to parse user documentation JSON', parseError, {
        rawResponse: cleanedDocs.substring(0, 500),
      });
      return Response.json(
        {
          success: false,
          error: 'Failed to parse user documentation response as JSON',
        },
        { status: 500 }
      );
    }

    // Validate the structure
    if (!parsedDocs.documents || !Array.isArray(parsedDocs.documents)) {
      logger.error('Invalid user documentation structure', undefined, {
        hasDocuments: !!parsedDocs.documents,
        isArray: Array.isArray(parsedDocs.documents),
      });
      return Response.json(
        {
          success: false,
          error: 'Invalid user documentation structure in response',
        },
        { status: 500 }
      );
    }

    logger.info('Successfully generated user documentation', {
      count: parsedDocs.documents.length,
    });
    return Response.json({
      success: true,
      documents: parsedDocs.documents,
    });
  } catch (error) {
    logger.apiError(request.method, '/api/generate-user-docs-structured', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return Response.json(
      {
        success: false,
        error: `Failed to generate user documentation: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

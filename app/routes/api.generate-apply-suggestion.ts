/**
 * React Router API Route for applying a suggestion to a diagram shape using Amazon Bedrock
 * Takes a shape's mermaid representation and a suggestion, returns updated mermaid
 */

import type { ActionFunctionArgs } from 'react-router';
import { getApplySuggestionSystemPrompt } from '~/design-studio/lib/llm/system-prompts';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  type InvokeModelCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';
import { logger } from '~/core/utils/logger';

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
const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'amazon.nova-pro-v1:0';
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
  logger.apiRequest(request.method, '/api/generate-apply-suggestion');

  try {
    const body = await request.json();
    const { targetShapeMermaid, suggestion, diagramType } = body;

    logger.debug('Apply suggestion request received', {
      mermaidLength: targetShapeMermaid?.length,
      suggestionLength: suggestion?.length,
      diagramType,
    });

    // Validate input
    if (!targetShapeMermaid || typeof targetShapeMermaid !== 'string' || targetShapeMermaid.trim().length === 0) {
      logger.warn('Validation error: empty target shape mermaid');
      return Response.json(
        {
          success: false,
          error: 'Target shape mermaid is required and must be a non-empty string',
        },
        { status: 400 }
      );
    }

    if (!suggestion || typeof suggestion !== 'string' || suggestion.trim().length === 0) {
      logger.warn('Validation error: empty suggestion');
      return Response.json(
        {
          success: false,
          error: 'Suggestion is required and must be a non-empty string',
        },
        { status: 400 }
      );
    }

    if (!diagramType || typeof diagramType !== 'string') {
      logger.warn('Validation error: invalid diagram type', { diagramType });
      return Response.json(
        {
          success: false,
          error: 'Diagram type is required and must be a string',
        },
        { status: 400 }
      );
    }

    // Get diagram-specific apply suggestion system prompt
    const systemPrompt = getApplySuggestionSystemPrompt(diagramType);

    // Prepare the user message with shape mermaid and suggestion
    const userMessage = `Apply this suggestion to the shape:

Shape Mermaid:
${targetShapeMermaid}

Suggestion: ${suggestion}

Return ONLY the updated Mermaid syntax.`;

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

    logger.debug('Bedrock request prepared for apply suggestion', {
      modelId: MODEL_ID,
      region: AWS_REGION,
    });

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(bedrockRequest),
    });

    // Call Bedrock with timeout
    logger.info('Sending apply suggestion request to Bedrock');

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Bedrock request timed out after 120 seconds'));
      }, 120000);
    });

    const response = (await Promise.race([
      client.send(command),
      timeoutPromise,
    ])) as InvokeModelCommandOutput;

    logger.info('Bedrock apply suggestion response received', {
      statusCode: response.$metadata.httpStatusCode,
    });

    // Parse the response
    const responseBody: BedrockResponseBody = JSON.parse(
      new TextDecoder().decode(response.body)
    );

    // Extract generated content from response
    const generatedContent =
      responseBody.choices?.[0]?.message?.content ||
      responseBody.content?.[0]?.text ||
      responseBody.output?.text ||
      responseBody.text ||
      responseBody.output?.message?.content?.[0]?.text ||
      '';

    logger.debug('Extracted apply suggestion response', { length: generatedContent.length });

    if (!generatedContent) {
      logger.error('Failed to extract mermaid from response');
      return Response.json(
        {
          success: false,
          error: 'No mermaid generated from the model',
        },
        { status: 500 }
      );
    }

    // Clean up the generated content (remove markdown code blocks if present)
    let cleanedContent = generatedContent.trim();
    if (cleanedContent.startsWith('```mermaid')) {
      cleanedContent = cleanedContent.slice(10);
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    logger.info('Successfully applied suggestion', {
      outputLength: cleanedContent.length,
    });

    return Response.json({
      success: true,
      mermaid: cleanedContent,
    });
  } catch (error) {
    logger.apiError(request.method, '/api/generate-apply-suggestion', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return Response.json(
      {
        success: false,
        error: `Failed to apply suggestion: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

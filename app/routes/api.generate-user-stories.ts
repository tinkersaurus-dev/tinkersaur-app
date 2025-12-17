/**
 * React Router API Route for generating user stories using Amazon Bedrock
 * Using AWS SDK with bearer token authentication
 * Returns JSON array of markdown strings for flexible formatting
 */

import type { ActionFunctionArgs } from 'react-router';
import { getSystemPrompt } from '~/design-studio/lib/llm/system-prompts';
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
  logger.apiRequest(request.method, '/api/generate-user-stories');

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

    // Get user stories system prompt (returns JSON array of markdown strings)
    const systemPrompt = getSystemPrompt('user-stories-structured');

    // Prepare the request for the model
    const userMessage = `Generate user stories with acceptance criteria as a JSON array of markdown strings from the following design documentation:\n\n${content}`;

    const bedrockRequest = {
      system: [{ text: systemPrompt }],
      messages: [
        {
          role: 'user',
          content: [{ text: userMessage }],
        },
      ],
      inferenceConfig: {
        maxTokens: 8192, // Higher limit for user stories output
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
    logger.info('Sending request to Bedrock for user stories generation');

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

    // Extract generated user stories from response
    const generatedStories =
      responseBody.choices?.[0]?.message?.content ||
      responseBody.content?.[0]?.text ||
      responseBody.output?.text ||
      responseBody.text ||
      responseBody.output?.message?.content?.[0]?.text ||
      '';

    logger.debug('Extracted user stories', { length: generatedStories.length });

    if (!generatedStories) {
      logger.error('Failed to extract user stories from response', undefined, {
        hasChoices: !!responseBody.choices,
        hasContent: !!responseBody.content,
        hasOutput: !!responseBody.output,
      });
      return Response.json(
        {
          success: false,
          error: 'No user stories generated from the model. Check server logs for details.',
        },
        { status: 500 }
      );
    }

    // Clean up the generated content and parse JSON
    let cleanedStories = generatedStories.trim();

    // Remove markdown code blocks if present
    if (cleanedStories.startsWith('```json')) {
      cleanedStories = cleanedStories.slice(7);
    } else if (cleanedStories.startsWith('```')) {
      cleanedStories = cleanedStories.slice(3);
    }
    if (cleanedStories.endsWith('```')) {
      cleanedStories = cleanedStories.slice(0, -3);
    }
    cleanedStories = cleanedStories.trim();

    // Parse the JSON response - expecting an array of markdown strings
    let parsedStories: string[];
    try {
      parsedStories = JSON.parse(cleanedStories);
    } catch (parseError) {
      logger.error('Failed to parse user stories JSON', parseError, {
        rawResponse: cleanedStories.substring(0, 500),
      });
      return Response.json(
        {
          success: false,
          error: 'Failed to parse user stories response as JSON',
        },
        { status: 500 }
      );
    }

    // Validate the structure - should be an array of strings
    if (!Array.isArray(parsedStories)) {
      logger.error('Invalid user stories structure - expected array', undefined, {
        type: typeof parsedStories,
      });
      return Response.json(
        {
          success: false,
          error: 'Invalid user stories structure in response - expected array',
        },
        { status: 500 }
      );
    }

    // Filter to ensure all items are strings
    const validStories = parsedStories.filter(
      (story): story is string => typeof story === 'string' && story.trim().length > 0
    );

    logger.info('Successfully generated user stories', {
      count: validStories.length,
    });
    return Response.json({
      success: true,
      stories: validStories,
    });
  } catch (error) {
    logger.apiError(request.method, '/api/generate-user-stories', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return Response.json(
      {
        success: false,
        error: `Failed to generate user stories: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

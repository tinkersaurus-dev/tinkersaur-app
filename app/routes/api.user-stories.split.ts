/**
 * React Router API Route for splitting a user story using Amazon Bedrock
 * Uses AWS SDK with bearer token authentication
 * Returns multiple stories as structured JSON
 */

import type { ActionFunctionArgs } from 'react-router';
import { getSystemPrompt } from '~/design-studio/lib/llm/system-prompts';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  type InvokeModelCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';
import { logger } from '~/core/utils/logger';
import type { UserStory, UserStoryResponse } from '~/design-studio/lib/llm/types';

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
  logger.apiRequest(request.method, '/api/user-stories/split');

  try {
    const body = await request.json();
    const { story, instructions } = body as {
      story: UserStory;
      instructions?: string;
    };

    logger.debug('Request received', {
      storyId: story?.id,
      hasInstructions: !!instructions,
    });

    // Validate input
    if (!story || !story.title || !story.story) {
      logger.warn('Validation error: invalid story structure');
      return Response.json(
        {
          success: false,
          error: 'A valid story is required for splitting',
        },
        { status: 400 }
      );
    }

    // Get split system prompt
    const systemPrompt = getSystemPrompt('user-stories-split');

    // Prepare the request for the model
    let userMessage = `Split the following user story into multiple smaller, more focused stories:\n\n${JSON.stringify(story, null, 2)}`;

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
    logger.info('Sending request to Bedrock for story splitting');

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

    // Extract generated stories from response
    const generatedStories =
      responseBody.choices?.[0]?.message?.content ||
      responseBody.content?.[0]?.text ||
      responseBody.output?.text ||
      responseBody.text ||
      responseBody.output?.message?.content?.[0]?.text ||
      '';

    logger.debug('Extracted split stories', { length: generatedStories.length });

    if (!generatedStories) {
      logger.error('Failed to extract split stories from response');
      return Response.json(
        {
          success: false,
          error: 'No stories generated from the model.',
        },
        { status: 500 }
      );
    }

    // Clean up and parse JSON
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

    // Parse the JSON response
    let parsedStories: { stories: UserStoryResponse[] };
    try {
      parsedStories = JSON.parse(cleanedStories);
    } catch (parseError) {
      logger.error('Failed to parse split stories JSON', parseError, {
        rawResponse: cleanedStories.substring(0, 500),
      });
      return Response.json(
        {
          success: false,
          error: 'Failed to parse split stories response as JSON',
        },
        { status: 500 }
      );
    }

    // Validate the structure
    if (!parsedStories.stories || !Array.isArray(parsedStories.stories) || parsedStories.stories.length === 0) {
      logger.error('Invalid split stories structure', undefined, {
        hasStories: !!parsedStories.stories,
        isArray: Array.isArray(parsedStories.stories),
        count: parsedStories.stories?.length,
      });
      return Response.json(
        {
          success: false,
          error: 'Invalid split stories structure in response',
        },
        { status: 500 }
      );
    }

    logger.info('Successfully split user story', {
      resultCount: parsedStories.stories.length,
    });
    return Response.json({
      success: true,
      stories: parsedStories.stories,
    });
  } catch (error) {
    logger.apiError(request.method, '/api/user-stories/split', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return Response.json(
      {
        success: false,
        error: `Failed to split user story: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

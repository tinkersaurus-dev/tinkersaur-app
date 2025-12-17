/**
 * React Router API Route for regenerating a user story using Amazon Bedrock
 * Uses AWS SDK with bearer token authentication
 * Returns a single regenerated story as a markdown string
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
  logger.apiRequest(request.method, '/api/user-stories/regenerate');

  try {
    const body = await request.json();
    const { story, originalContent, instructions } = body as {
      story: string; // Markdown content string
      originalContent: string;
      instructions?: string;
    };

    logger.debug('Request received', {
      storyLength: story?.length,
      contentLength: originalContent?.length,
      hasInstructions: !!instructions,
    });

    // Validate input
    if (!story || typeof story !== 'string' || story.trim().length === 0) {
      logger.warn('Validation error: invalid story content');
      return Response.json(
        {
          success: false,
          error: 'A valid story is required for regeneration',
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
    const systemPrompt = getSystemPrompt('user-stories-regenerate');

    // Prepare the request for the model - send markdown content directly
    let userMessage = `Regenerate and improve the following user story based on the original design documentation.\n\n`;
    userMessage += `Current Story:\n${story}\n\n`;
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
    logger.info('Sending request to Bedrock for story regeneration');

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

    // Extract regenerated story from response
    const regeneratedStory =
      responseBody.choices?.[0]?.message?.content ||
      responseBody.content?.[0]?.text ||
      responseBody.output?.text ||
      responseBody.text ||
      responseBody.output?.message?.content?.[0]?.text ||
      '';

    logger.debug('Extracted regenerated story', { length: regeneratedStory.length });

    if (!regeneratedStory) {
      logger.error('Failed to extract regenerated story from response');
      return Response.json(
        {
          success: false,
          error: 'No regenerated story generated from the model.',
        },
        { status: 500 }
      );
    }

    // Clean up the response - it should be raw markdown, not JSON
    let cleanedStory = regeneratedStory.trim();

    // Remove markdown code blocks if present (LLM might wrap in code blocks)
    if (cleanedStory.startsWith('```markdown')) {
      cleanedStory = cleanedStory.slice(11);
    } else if (cleanedStory.startsWith('```md')) {
      cleanedStory = cleanedStory.slice(5);
    } else if (cleanedStory.startsWith('```')) {
      cleanedStory = cleanedStory.slice(3);
    }
    if (cleanedStory.endsWith('```')) {
      cleanedStory = cleanedStory.slice(0, -3);
    }
    cleanedStory = cleanedStory.trim();

    // Validate the response has content
    if (!cleanedStory || cleanedStory.length === 0) {
      logger.error('Empty regenerated story response');
      return Response.json(
        {
          success: false,
          error: 'Empty regenerated story in response',
        },
        { status: 500 }
      );
    }

    logger.info('Successfully regenerated user story');
    return Response.json({
      success: true,
      story: cleanedStory,
    });
  } catch (error) {
    logger.apiError(request.method, '/api/user-stories/regenerate', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return Response.json(
      {
        success: false,
        error: `Failed to regenerate user story: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

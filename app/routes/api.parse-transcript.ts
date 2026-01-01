/**
 * React Router API Route for parsing transcripts using Amazon Bedrock
 * Extracts personas, use cases, and feedback from meeting transcripts
 */

import type { ActionFunctionArgs } from 'react-router';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  type InvokeModelCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';
import { logger } from '~/core/utils/logger';
import {
  TRANSCRIPT_PARSING_SYSTEM_PROMPT,
  buildTranscriptUserPrompt,
} from '~/discovery/lib/prompts';
import type {
  IntakeResult,
  ParseTranscriptResponse,
} from '~/core/entities/discovery';

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
  logger.apiRequest(request.method, '/api/parse-transcript');
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { sourceType, content, metadata = {} } = body;

    logger.debug('Request received', {
      sourceType,
      contentLength: content?.length,
      hasMetadata: Object.keys(metadata).length > 0,
    });

    // Validate input
    if (!sourceType || typeof sourceType !== 'string') {
      logger.warn('Validation error: missing sourceType');
      return Response.json(
        {
          success: false,
          error: 'sourceType is required',
        } satisfies ParseTranscriptResponse,
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || content.trim().length < 50) {
      logger.warn('Validation error: content too short or missing');
      return Response.json(
        {
          success: false,
          error: 'Content is required and must be at least 50 characters',
        } satisfies ParseTranscriptResponse,
        { status: 400 }
      );
    }

    // Build the user prompt with metadata
    const userMessage = buildTranscriptUserPrompt(content, metadata);

    const bedrockRequest = {
      system: [{ text: TRANSCRIPT_PARSING_SYSTEM_PROMPT }],
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
    logger.info('Sending request to Bedrock for transcript parsing');

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

    // Extract generated content from response
    const generatedContent =
      responseBody.choices?.[0]?.message?.content ||
      responseBody.content?.[0]?.text ||
      responseBody.output?.text ||
      responseBody.text ||
      responseBody.output?.message?.content?.[0]?.text ||
      '';

    logger.debug('Extracted content', { length: generatedContent.length });

    if (!generatedContent) {
      logger.error('Failed to extract content from response', undefined, {
        hasChoices: !!responseBody.choices,
        hasContent: !!responseBody.content,
        hasOutput: !!responseBody.output,
      });
      return Response.json(
        {
          success: false,
          error: 'No content generated from the model. Check server logs for details.',
        } satisfies ParseTranscriptResponse,
        { status: 500 }
      );
    }

    // Clean up the generated content and parse JSON
    let cleanedContent = generatedContent.trim();

    // Remove markdown code blocks if present
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7);
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    // Parse the JSON response
    let parsedResult: unknown;
    try {
      parsedResult = JSON.parse(cleanedContent);
    } catch (parseError) {
      logger.error('Failed to parse transcript result JSON', parseError, {
        rawResponse: cleanedContent.substring(0, 500),
      });
      return Response.json(
        {
          success: false,
          error: 'Failed to parse transcript analysis response as JSON',
        } satisfies ParseTranscriptResponse,
        { status: 500 }
      );
    }

    // Build the result from parsed JSON
    const processingTime = Date.now() - startTime;
    const llmResult = parsedResult as {
      personas?: unknown[];
      useCases?: unknown[];
      feedback?: unknown[];
    };

    const result: IntakeResult = {
      sourceType,
      metadata,
      personas: Array.isArray(llmResult.personas)
        ? (llmResult.personas as IntakeResult['personas'])
        : [],
      useCases: Array.isArray(llmResult.useCases)
        ? (llmResult.useCases as IntakeResult['useCases'])
        : [],
      feedback: Array.isArray(llmResult.feedback)
        ? (llmResult.feedback as IntakeResult['feedback'])
        : [],
      processingTime,
    };

    logger.info('Successfully parsed transcript', {
      personaCount: result.personas.length,
      useCaseCount: result.useCases.length,
      feedbackCount: result.feedback.length,
      processingTime,
    });

    return Response.json({
      success: true,
      result,
    } satisfies ParseTranscriptResponse);
  } catch (error) {
    logger.apiError(request.method, '/api/parse-transcript', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return Response.json(
      {
        success: false,
        error: `Failed to parse transcript: ${errorMessage}`,
      } satisfies ParseTranscriptResponse,
      { status: 500 }
    );
  }
}

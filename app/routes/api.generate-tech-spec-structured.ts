/**
 * React Router API Route for generating structured technical specifications using Amazon Bedrock
 * Returns multiple sections as structured JSON for interactive editing
 */

import type { ActionFunctionArgs } from 'react-router';
import { getSystemPrompt } from '~/design-studio/lib/llm/system-prompts';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  type InvokeModelCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';
import { logger } from '~/core/utils/logger';
import type { TechSpecSectionResponse } from '~/design-studio/lib/llm/types';

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
  logger.apiRequest(request.method, '/api/generate-tech-spec-structured');

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

    // Get structured tech spec system prompt
    const systemPrompt = getSystemPrompt('tech-spec-structured');

    // Prepare the request for the model
    const userMessage = `Generate a detailed technical specification as structured JSON from the following design documentation. Create implementation-ready sections covering system overview, data models, APIs, business logic, integrations, non-functional requirements, and technical constraints as applicable:\n\n${content}`;

    const bedrockRequest = {
      system: [{ text: systemPrompt }],
      messages: [
        {
          role: 'user',
          content: [{ text: userMessage }],
        },
      ],
      inferenceConfig: {
        maxTokens: 10240, // Maximum allowed by model
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
    logger.info('Sending request to Bedrock for tech spec generation');

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

    // Extract generated sections from response
    const generatedSpec =
      responseBody.choices?.[0]?.message?.content ||
      responseBody.content?.[0]?.text ||
      responseBody.output?.text ||
      responseBody.text ||
      responseBody.output?.message?.content?.[0]?.text ||
      '';

    logger.debug('Extracted tech spec', { length: generatedSpec.length });

    if (!generatedSpec) {
      logger.error('Failed to extract tech spec from response', undefined, {
        hasChoices: !!responseBody.choices,
        hasContent: !!responseBody.content,
        hasOutput: !!responseBody.output,
      });
      return Response.json(
        {
          success: false,
          error: 'No technical specification generated from the model. Check server logs for details.',
        },
        { status: 500 }
      );
    }

    // Clean up the generated content and parse JSON
    let cleanedSpec = generatedSpec.trim();

    // Remove markdown code blocks if present
    if (cleanedSpec.startsWith('```json')) {
      cleanedSpec = cleanedSpec.slice(7);
    } else if (cleanedSpec.startsWith('```')) {
      cleanedSpec = cleanedSpec.slice(3);
    }
    if (cleanedSpec.endsWith('```')) {
      cleanedSpec = cleanedSpec.slice(0, -3);
    }
    cleanedSpec = cleanedSpec.trim();

    // Parse the JSON response
    let parsedSpec: { sections: TechSpecSectionResponse[] };
    try {
      parsedSpec = JSON.parse(cleanedSpec);
    } catch (parseError) {
      logger.error('Failed to parse tech spec JSON', parseError, {
        rawResponse: cleanedSpec.substring(0, 500),
      });
      return Response.json(
        {
          success: false,
          error: 'Failed to parse technical specification response as JSON',
        },
        { status: 500 }
      );
    }

    // Validate the structure
    if (!parsedSpec.sections || !Array.isArray(parsedSpec.sections)) {
      logger.error('Invalid tech spec structure', undefined, {
        hasSections: !!parsedSpec.sections,
        isArray: Array.isArray(parsedSpec.sections),
      });
      return Response.json(
        {
          success: false,
          error: 'Invalid technical specification structure in response',
        },
        { status: 500 }
      );
    }

    logger.info('Successfully generated tech spec', {
      count: parsedSpec.sections.length,
    });
    return Response.json({
      success: true,
      sections: parsedSpec.sections,
    });
  } catch (error) {
    logger.apiError(request.method, '/api/generate-tech-spec-structured', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return Response.json(
      {
        success: false,
        error: `Failed to generate technical specification: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

/**
 * React Router API Route for merging personas using Amazon Bedrock
 * Uses AWS SDK with bearer token authentication
 * Returns a merged persona as a JSON object
 */

import type { ActionFunctionArgs } from 'react-router';
import { PERSONA_MERGE_SYSTEM_PROMPT } from '~/discovery/lib/prompts';
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

// Type for input persona
interface PersonaInput {
  name: string;
  role: string;
  description: string;
  goals: string[];
  painPoints: string[];
  demographics?: {
    education?: string;
    experience?: string;
    industry?: string;
  };
}

// Type for merged persona output
interface MergedPersonaOutput {
  name: string;
  description: string;
  role: string;
  goals: string[];
  painPoints: string[];
  demographics?: {
    education?: string;
    experience?: string;
    industry?: string;
  };
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
  logger.apiRequest(request.method, '/api/merge-personas');

  try {
    const body = await request.json();
    const { personas, instructions } = body as {
      personas: PersonaInput[];
      instructions?: string;
    };

    logger.debug('Request received', {
      personaCount: personas?.length,
      hasInstructions: !!instructions,
    });

    // Validate input
    if (!personas || !Array.isArray(personas) || personas.length < 2) {
      logger.warn('Validation error: need at least 2 personas');
      return Response.json(
        {
          success: false,
          error: 'At least 2 personas are required for merging',
        },
        { status: 400 }
      );
    }

    // Prepare the request for the model
    let userMessage = `Merge the following personas into a single, unified persona:\n\n`;
    personas.forEach((persona, index) => {
      userMessage += `--- Persona ${index + 1} ---\n${JSON.stringify(persona, null, 2)}\n\n`;
    });

    if (instructions) {
      userMessage += `\n\nAdditional instructions: ${instructions}`;
    }

    const bedrockRequest = {
      system: [{ text: PERSONA_MERGE_SYSTEM_PROMPT }],
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
    logger.info('Sending request to Bedrock for persona merge');

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

    // Extract generated content from response
    const generatedContent =
      responseBody.choices?.[0]?.message?.content ||
      responseBody.content?.[0]?.text ||
      responseBody.output?.text ||
      responseBody.text ||
      responseBody.output?.message?.content?.[0]?.text ||
      '';

    logger.debug('Extracted merged persona content', { length: generatedContent.length });

    if (!generatedContent) {
      logger.error('Failed to extract merged persona from response');
      return Response.json(
        {
          success: false,
          error: 'No merged persona generated from the model.',
        },
        { status: 500 }
      );
    }

    // Clean up the response - remove markdown code blocks if present
    let cleanedContent = generatedContent.trim();

    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7);
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    // Parse JSON response
    let mergedPersona: MergedPersonaOutput;
    try {
      mergedPersona = JSON.parse(cleanedContent);
    } catch {
      logger.error('Failed to parse merged persona JSON', { content: cleanedContent });
      return Response.json(
        {
          success: false,
          error: 'Failed to parse merged persona response as JSON',
        },
        { status: 500 }
      );
    }

    // Validate the response structure
    if (!mergedPersona.name || !mergedPersona.description) {
      logger.error('Invalid merged persona structure', { mergedPersona });
      return Response.json(
        {
          success: false,
          error: 'Merged persona is missing required fields',
        },
        { status: 500 }
      );
    }

    logger.info('Successfully merged personas');
    return Response.json({
      success: true,
      mergedPersona,
    });
  } catch (error) {
    logger.apiError(request.method, '/api/merge-personas', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return Response.json(
      {
        success: false,
        error: `Failed to merge personas: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

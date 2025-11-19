/**
 * React Router API Route for generating Mermaid diagrams using Amazon Bedrock
 * Using AWS SDK with bearer token authentication
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

logger.info('API Route initialized', {
  bearerTokenExists: !!BEARER_TOKEN,
  bearerTokenLength: BEARER_TOKEN?.length,
  region: AWS_REGION,
  modelId: MODEL_ID,
});

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
  logger.apiRequest(request.method, '/api/generate-mermaid');

  try {
    const body = await request.json();
    const { prompt, diagramType = 'bpmn' } = body;

    logger.debug('Request received', {
      promptPreview: prompt?.substring(0, 100),
      diagramType,
    });

    // Validate input
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      logger.warn('Validation error: empty prompt');
      return Response.json(
        {
          success: false,
          error: 'Prompt is required and must be a non-empty string',
        },
        { status: 400 }
      );
    }

    if (typeof diagramType !== 'string') {
      logger.warn('Validation error: invalid diagram type', { diagramType });
      return Response.json(
        {
          success: false,
          error: 'Diagram type must be a string',
        },
        { status: 400 }
      );
    }

    // Get appropriate system prompt
    logger.debug('Getting system prompt', { diagramType });
    const systemPrompt = getSystemPrompt(diagramType);

    // Prepare the request for Qwen model using messages format
    const bedrockRequest = {
      system: [
        { text: systemPrompt }
      ],
      messages: [
        {
          role: 'user',
          content: [
            {
            text: `Generate a ${diagramType === 'bpmn' ? 'BPMN' : diagramType === 'class' ? 'Class' : 'Sequence'} diagram for: ${prompt}`,
            } 
          ]
        },
      ],
      inferenceConfig: { // all Optional, Invoke parameter names used in this example
        maxTokens: 4096, // greater than 0, equal or less than 5k (default: dynamic*)
        temperature: 0.7, // greater than 0 and less than 1.0 (default: 0.7)
        topP: 0.9, // greater than 0, equal or less than 1.0 (default: 0.9)
      }
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
    logger.info('Sending request to Bedrock');

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Bedrock request timed out after 120 seconds'));
      }, 120000);
    });

    // Race between the actual request and the timeout
    const response = await Promise.race([
      client.send(command),
      timeoutPromise
    ]) as InvokeModelCommandOutput;

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

    // Extract generated Mermaid code from response
    const generatedMermaid =
      responseBody.choices?.[0]?.message?.content ||
      responseBody.content?.[0]?.text ||
      responseBody.output?.text ||
      responseBody.text ||
      responseBody.output?.message?.content?.[0]?.text ||
      '';

    logger.debug('Extracted mermaid code', { length: generatedMermaid.length });

    if (!generatedMermaid) {
      logger.error('Failed to extract Mermaid from response', undefined, {
        hasChoices: !!responseBody.choices,
        hasContent: !!responseBody.content,
        hasOutput: !!responseBody.output,
      });
      return Response.json(
        {
          success: false,
          error: 'No Mermaid diagram generated from the model. Check server logs for details.',
        },
        { status: 500 }
      );
    }

    // Clean up the generated code (remove any markdown artifacts if present)
    let cleanedMermaid = generatedMermaid.trim();

    // Remove markdown code blocks if they somehow got included
    cleanedMermaid = cleanedMermaid.replace(/^```(?:mermaid)?\n?/gm, '');
    cleanedMermaid = cleanedMermaid.replace(/\n?```$/gm, '');

    logger.debug('Cleaned mermaid preview', {
      preview: cleanedMermaid.substring(0, 100),
    });

    // Validate that it starts with the expected diagram type
    const expectedStart = diagramType === 'bpmn'
      ? 'flowchart'
      : diagramType === 'class'
      ? 'classDiagram'
      : 'sequenceDiagram';

    if (!cleanedMermaid.startsWith(expectedStart)) {
      logger.error('Generated content validation failed', undefined, {
        expectedStart,
        actualStart: cleanedMermaid.substring(0, 50),
      });
      return Response.json(
        {
          success: false,
          error: `Generated diagram is not in valid Mermaid ${diagramType} format`,
        },
        { status: 500 }
      );
    }

    logger.info('Successfully generated and validated mermaid diagram');
    return Response.json({
      success: true,
      mermaid: cleanedMermaid,
    });
  } catch (error) {
    logger.apiError(request.method, '/api/generate-mermaid', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return Response.json(
      {
        success: false,
        error: `Failed to generate Mermaid diagram: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

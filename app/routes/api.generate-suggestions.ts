/**
 * React Router API Route for generating diagram improvement suggestions using Amazon Bedrock
 * Analyzes Mermaid diagrams and returns actionable suggestions
 */

import type { ActionFunctionArgs } from 'react-router';
import { getSuggestionsSystemPrompt } from '~/design-studio/lib/llm/system-prompts';
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

// Type for suggestion response
interface Suggestion {
  shapeLabel: string;
  suggestion: string;
}

interface SuggestionsResponse {
  suggestions: Suggestion[];
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
  logger.apiRequest(request.method, '/api/generate-suggestions');

  try {
    const body = await request.json();
    const { mermaidSyntax, diagramType } = body;

    logger.debug('Suggestions request received', {
      mermaidLength: mermaidSyntax?.length,
      diagramType,
    });

    // Validate input
    if (!mermaidSyntax || typeof mermaidSyntax !== 'string' || mermaidSyntax.trim().length === 0) {
      logger.warn('Validation error: empty mermaid syntax');
      return Response.json(
        {
          success: false,
          error: 'Mermaid syntax is required and must be a non-empty string',
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

    // Get diagram-specific suggestions system prompt
    const systemPrompt = getSuggestionsSystemPrompt(diagramType);

    // Prepare the user message with diagram
    const userMessage = `Analyze this diagram and provide improvement suggestions:

\`\`\`mermaid
${mermaidSyntax}
\`\`\`

Return your suggestions as JSON.`;

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

    logger.debug('Bedrock request prepared for suggestions', {
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
    logger.info('Sending suggestions request to Bedrock');

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Bedrock request timed out after 120 seconds'));
      }, 120000);
    });

    const response = (await Promise.race([
      client.send(command),
      timeoutPromise,
    ])) as InvokeModelCommandOutput;

    logger.info('Bedrock suggestions response received', {
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

    logger.debug('Extracted suggestions response', { length: generatedContent.length });

    if (!generatedContent) {
      logger.error('Failed to extract suggestions from response');
      return Response.json(
        {
          success: false,
          error: 'No suggestions generated from the model',
        },
        { status: 500 }
      );
    }

    // Clean up the generated content (remove markdown code blocks if present)
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

    // Parse the JSON response
    let parsedSuggestions: SuggestionsResponse;
    try {
      parsedSuggestions = JSON.parse(cleanedContent);
    } catch (parseError) {
      logger.error('Failed to parse suggestions JSON', parseError);
      return Response.json(
        {
          success: false,
          error: 'Failed to parse suggestions response as JSON',
        },
        { status: 500 }
      );
    }

    // Validate the response structure
    if (!parsedSuggestions.suggestions || !Array.isArray(parsedSuggestions.suggestions)) {
      logger.error('Invalid suggestions structure', undefined, {
        hasSuggestions: !!parsedSuggestions.suggestions,
        isArray: Array.isArray(parsedSuggestions.suggestions),
      });
      return Response.json(
        {
          success: false,
          error: 'Invalid suggestions format: expected { suggestions: [] }',
        },
        { status: 500 }
      );
    }

    // Validate each suggestion has required fields
    const validSuggestions = parsedSuggestions.suggestions.filter(
      (s): s is Suggestion =>
        typeof s.shapeLabel === 'string' &&
        typeof s.suggestion === 'string' &&
        s.shapeLabel.trim().length > 0 &&
        s.suggestion.trim().length > 0
    );

    logger.info('Successfully generated suggestions', {
      totalSuggestions: parsedSuggestions.suggestions.length,
      validSuggestions: validSuggestions.length,
    });

    return Response.json({
      success: true,
      suggestions: validSuggestions,
    });
  } catch (error) {
    logger.apiError(request.method, '/api/generate-suggestions', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return Response.json(
      {
        success: false,
        error: `Failed to generate suggestions: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

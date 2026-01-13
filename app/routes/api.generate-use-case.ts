/**
 * React Router API Route for generating a use case from a rough description using Amazon Bedrock
 * Returns a structured use case with name and description
 */

import type { ActionFunctionArgs } from 'react-router';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  type InvokeModelCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';
import { logger } from '~/core/utils/logger';

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

interface GenerateUseCaseRequest {
  description: string;
}

interface GeneratedUseCase {
  name: string;
  description: string;
}

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'amazon.nova-pro-v1:0';
const BEARER_TOKEN = process.env.AWS_BEARER_TOKEN_BEDROCK;

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

const SYSTEM_PROMPT = `You are a product management expert. Your task is to generate a clear, well-structured use case from a rough description provided by the user.

A use case describes something a user wants to accomplish with a product or system. It should capture the user's goal and the key steps or capabilities they need.

Given the user's rough description, generate:
1. A concise name (1-8 words) that clearly identifies the use case
2. A detailed description (2-4 sentences) that explains what the user is trying to accomplish, why it matters, and any key context

IMPORTANT: Return ONLY a valid JSON object with "name" and "description" fields. Do not wrap in markdown code blocks. Do not include any text before or after the JSON.

Example input: "Users need to be able to export their data to Excel so they can analyze it with their existing tools"

Example output:
{"name":"Export Data to Excel","description":"Users need the ability to export their data from the application into Excel format. This enables them to perform custom analysis using their existing spreadsheet workflows and share insights with stakeholders who prefer working with Excel files."}`;

export async function action({ request }: ActionFunctionArgs) {
  logger.apiRequest(request.method, '/api/generate-use-case');

  try {
    const body: GenerateUseCaseRequest = await request.json();
    const { description } = body;

    logger.debug('Request received', {
      descriptionLength: description?.length || 0,
    });

    if (!description || description.trim().length === 0) {
      logger.warn('Validation error: missing description');
      return Response.json(
        {
          success: false,
          error: 'Description is required',
        },
        { status: 400 }
      );
    }

    const userMessage = `Generate a use case from this description:\n\n${description}`;

    const bedrockRequest = {
      system: [{ text: SYSTEM_PROMPT }],
      messages: [
        {
          role: 'user',
          content: [{ text: userMessage }],
        },
      ],
      inferenceConfig: {
        maxTokens: 1024,
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

    logger.info('Sending request to Bedrock for use case generation');

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Bedrock request timed out after 60 seconds'));
      }, 60000);
    });

    const response = (await Promise.race([
      client.send(command),
      timeoutPromise,
    ])) as InvokeModelCommandOutput;

    logger.info('Bedrock response received', {
      statusCode: response.$metadata.httpStatusCode,
    });

    const responseBody: BedrockResponseBody = JSON.parse(new TextDecoder().decode(response.body));

    logger.debug('Response body parsed', {
      hasChoices: !!responseBody.choices,
      hasContent: !!responseBody.content,
      hasOutput: !!responseBody.output,
    });

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
        },
        { status: 500 }
      );
    }

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

    let useCase: GeneratedUseCase;
    try {
      const parsed = JSON.parse(cleanedContent);

      if (!parsed.name || !parsed.description) {
        throw new Error('Response missing required fields');
      }

      useCase = {
        name: String(parsed.name).slice(0, 200),
        description: String(parsed.description).slice(0, 2000),
      };
    } catch (parseError) {
      logger.error('Failed to parse JSON response', parseError instanceof Error ? parseError : undefined, {
        rawContent: cleanedContent.substring(0, 500),
      });

      return Response.json(
        {
          success: false,
          error: 'Failed to parse generated use case. Please try again.',
        },
        { status: 500 }
      );
    }

    logger.info('Successfully generated use case', {
      name: useCase.name,
    });

    return Response.json({
      success: true,
      useCase,
    });
  } catch (error) {
    logger.apiError(request.method, '/api/generate-use-case', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return Response.json(
      {
        success: false,
        error: `Failed to generate use case: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

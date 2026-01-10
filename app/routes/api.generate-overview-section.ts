/**
 * React Router API Route for generating overview sections using Amazon Bedrock
 * Returns markdown content for a specific overview section
 */

import type { ActionFunctionArgs } from 'react-router';
import {
  getOverviewSectionPrompt,
  type OverviewSectionType,
} from '~/design-studio/lib/llm/prompts/overview-prompts';
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

// Request types
interface SolutionContext {
  name: string;
  description: string;
  type: string;
}

interface PersonaContext {
  name: string;
  role: string;
  description: string;
  goals: string[];
  painPoints: string[];
}

interface UseCaseContext {
  name: string;
  description: string;
  quotes: string[];
}

interface FeedbackContext {
  type: string;
  content: string;
  quotes: string[];
}

interface OutcomeContext {
  description: string;
  target: string;
}

interface GenerateOverviewRequest {
  sectionType: OverviewSectionType;
  solutionContext: SolutionContext;
  personas: PersonaContext[];
  useCases: UseCaseContext[];
  feedback: FeedbackContext[];
  outcomes: OutcomeContext[];
  existingContent?: string;
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

function compileUserMessage(params: GenerateOverviewRequest): string {
  const { sectionType, solutionContext, personas, useCases, feedback, outcomes, existingContent } =
    params;

  let message = `Generate the ${sectionType} section for this solution:\n\n`;

  message += `## Solution\n`;
  message += `Name: ${solutionContext.name}\n`;
  message += `Type: ${solutionContext.type}\n`;
  message += `Description: ${solutionContext.description}\n\n`;

  if (personas.length > 0) {
    message += `## Personas\n`;
    personas.forEach((p, i) => {
      message += `${i + 1}. **${p.name}** (${p.role})\n`;
      message += `   Description: ${p.description}\n`;
      if (p.goals.length) message += `   Goals: ${p.goals.join('; ')}\n`;
      if (p.painPoints.length) message += `   Pain Points: ${p.painPoints.join('; ')}\n`;
    });
    message += '\n';
  }

  if (useCases.length > 0) {
    message += `## Use Cases\n`;
    useCases.forEach((uc, i) => {
      message += `${i + 1}. **${uc.name}**: ${uc.description}\n`;
      if (uc.quotes.length) {
        message += `   Quotes: "${uc.quotes.slice(0, 3).join('"; "')}"\n`;
      }
    });
    message += '\n';
  }

  if (feedback.length > 0) {
    message += `## User Feedback\n`;
    feedback.forEach((f, i) => {
      message += `${i + 1}. [${f.type}] ${f.content}\n`;
    });
    message += '\n';
  }

  if (outcomes.length > 0) {
    message += `## Desired Outcomes\n`;
    outcomes.forEach((o, i) => {
      message += `${i + 1}. ${o.description}`;
      if (o.target) message += ` (Target: ${o.target})`;
      message += '\n';
    });
    message += '\n';
  }

  if (existingContent?.trim()) {
    message += `## Existing Content / Instructions\n`;
    message += `The user has provided the following content. Treat this as either a rough draft to refine, instructions to follow, or both:\n\n`;
    message += `${existingContent}\n\n`;
  }

  return message;
}

export async function action({ request }: ActionFunctionArgs) {
  logger.apiRequest(request.method, '/api/generate-overview-section');

  try {
    const body: GenerateOverviewRequest = await request.json();
    const { sectionType, solutionContext } = body;

    logger.debug('Request received', {
      sectionType,
      solutionName: solutionContext?.name,
      hasExistingContent: !!body.existingContent,
      personaCount: body.personas?.length || 0,
      useCaseCount: body.useCases?.length || 0,
      feedbackCount: body.feedback?.length || 0,
      outcomeCount: body.outcomes?.length || 0,
    });

    // Validate input
    if (!sectionType || !solutionContext) {
      logger.warn('Validation error: missing required fields');
      return Response.json(
        {
          success: false,
          error: 'Section type and solution context are required',
        },
        { status: 400 }
      );
    }

    // Get the appropriate system prompt
    const systemPrompt = getOverviewSectionPrompt(sectionType);

    // Compile the user message with full context
    const userMessage = compileUserMessage(body);

    // Prepare the request for the model
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
    logger.info('Sending request to Bedrock for overview section generation', { sectionType });

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
    const responseBody: BedrockResponseBody = JSON.parse(new TextDecoder().decode(response.body));

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
        },
        { status: 500 }
      );
    }

    // Clean up the generated content (remove any markdown code blocks if present)
    let cleanedContent = generatedContent.trim();
    if (cleanedContent.startsWith('```markdown')) {
      cleanedContent = cleanedContent.slice(11);
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    logger.info('Successfully generated overview section', {
      sectionType,
      contentLength: cleanedContent.length,
    });

    return Response.json({
      success: true,
      content: cleanedContent,
    });
  } catch (error) {
    logger.apiError(request.method, '/api/generate-overview-section', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return Response.json(
      {
        success: false,
        error: `Failed to generate overview section: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

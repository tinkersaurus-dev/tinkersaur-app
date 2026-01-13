/**
 * React Router API Route for generating solution factors using Amazon Bedrock
 * Returns an array of factor items (content + notes) for a specific factor type
 */

import type { ActionFunctionArgs } from 'react-router';
import {
  getFactorSectionPrompt,
  getFactorRefinementPrompt,
} from '~/design-studio/lib/llm/prompts/overview-prompts';
import type { SolutionFactorType } from '~/core/entities/product-management/types';
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

interface GenerateFactorRequest {
  sectionType: SolutionFactorType;
  solutionContext: SolutionContext;
  personas: PersonaContext[];
  useCases: UseCaseContext[];
  feedback: FeedbackContext[];
  outcomes: OutcomeContext[];
  existingContent?: string;
  /** Mode: 'generate' for bulk generation, 'refine' for single-factor refinement */
  mode?: 'generate' | 'refine';
}

interface GeneratedFactorItem {
  content: string;
  notes: string;
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

function compileUserMessage(params: GenerateFactorRequest, isRefinementMode: boolean): string {
  const { sectionType, solutionContext, personas, useCases, feedback, outcomes, existingContent } =
    params;

  let message = '';

  // Different intro for refinement vs generation mode
  if (isRefinementMode && existingContent?.trim()) {
    message += `# REFINEMENT REQUEST\n\n`;
    message += `${existingContent}\n\n`;
    message += `---\n\n`;
    message += `Use the following context to inform your refinement:\n\n`;
  } else {
    message += `Generate the ${sectionType} section for this solution:\n\n`;
  }

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

  // For non-refinement mode, still include existing content if provided
  if (!isRefinementMode && existingContent?.trim()) {
    message += `## Existing Content / Instructions\n`;
    message += `The user has provided the following content. Treat this as either a rough draft to refine, instructions to follow, or both:\n\n`;
    message += `${existingContent}\n\n`;
  }

  return message;
}

export async function action({ request }: ActionFunctionArgs) {
  logger.apiRequest(request.method, '/api/generate-overview-section');

  try {
    const body: GenerateFactorRequest = await request.json();
    const { sectionType, solutionContext } = body;

    const isRefinementMode = body.mode === 'refine';

    logger.debug('Request received', {
      sectionType,
      solutionName: solutionContext?.name,
      hasExistingContent: !!body.existingContent,
      mode: body.mode || 'generate',
      isRefinementMode,
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

    // Get the appropriate system prompt (use refinement prompt if in refine mode)
    const systemPrompt = isRefinementMode
      ? getFactorRefinementPrompt(sectionType)
      : getFactorSectionPrompt(sectionType);

    // Compile the user message with full context
    const userMessage = compileUserMessage(body, isRefinementMode);

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
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7);
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    // Parse JSON response - expecting array of strings
    let factors: GeneratedFactorItem[];
    try {
      const parsed = JSON.parse(cleanedContent);

      // Validate the structure
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      // Convert array of strings to factor items (notes always empty - for human use only)
      factors = parsed.map((item) => ({
        content: typeof item === 'string' ? item : (item.content || String(item)),
        notes: '',
      }));
    } catch (parseError) {
      logger.error('Failed to parse JSON response', parseError instanceof Error ? parseError : undefined, {
        rawContent: cleanedContent.substring(0, 500),
      });

      // Fallback: treat the content as a single factor
      factors = [{
        content: cleanedContent,
        notes: '',
      }];
    }

    logger.info('Successfully generated solution factors', {
      sectionType,
      factorCount: factors.length,
    });

    return Response.json({
      success: true,
      factors,
    });
  } catch (error) {
    logger.apiError(request.method, '/api/generate-overview-section', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return Response.json(
      {
        success: false,
        error: `Failed to generate factors: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

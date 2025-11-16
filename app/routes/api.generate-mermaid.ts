/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
/**
 * React Router API Route for generating Mermaid diagrams using Amazon Bedrock
 * Using AWS SDK with bearer token authentication
 */

import type { ActionFunctionArgs } from 'react-router';
import { getSystemPrompt } from '~/design-studio/lib/llm/system-prompts';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

// Bedrock configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'qwen.qwen3-coder-30b-a3b-v1:0';
const BEARER_TOKEN = process.env.AWS_BEARER_TOKEN_BEDROCK;

console.log('[API Route Init] Bearer token exists:', !!BEARER_TOKEN);
console.log('[API Route Init] Bearer token length:', BEARER_TOKEN?.length);
console.log('[API Route Init] AWS Region:', AWS_REGION);
console.log('[API Route Init] Model ID:', MODEL_ID);

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
  console.log('[API Route] /api/generate-mermaid called');

  try {
    const body = await request.json();
    const { prompt, diagramType = 'bpmn' } = body;

    console.log('[API Route] Request body:', { prompt: prompt.substring(0, 100), diagramType });

    // Validate input
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      console.error('[API Route] Validation error: empty prompt');
      return Response.json(
        {
          success: false,
          error: 'Prompt is required and must be a non-empty string',
        },
        { status: 400 }
      );
    }

    if (typeof diagramType !== 'string') {
      console.error('[API Route] Validation error: invalid diagram type');
      return Response.json(
        {
          success: false,
          error: 'Diagram type must be a string',
        },
        { status: 400 }
      );
    }

    // Get appropriate system prompt
    console.log('[API Route] Getting system prompt for:', diagramType);
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

    console.log('[API Route] Bedrock request prepared, model:', MODEL_ID);
    console.log('[API Route] Region:', process.env.AWS_REGION || 'us-east-1');
    console.log('[API Route] Using bearer token:', !!BEARER_TOKEN);

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(bedrockRequest),
    });

    // Call Bedrock with timeout
    console.log('[API Route] Sending request to Bedrock...');

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
    ]) as any;

    console.log('[API Route] ✅ BEDROCK RESPONSE RECEIVED - Starting to process response');
    console.log('[API Route] Response metadata:', response);

    // Parse the response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log('[API Route] Response body structure:', responseBody.output.message.content[0].text);

    // Extract generated Mermaid code from response
    const generatedMermaid =
      responseBody.choices?.[0]?.message?.content ||
      responseBody.content?.[0]?.text ||
      responseBody.output?.text ||
      responseBody.text ||
      responseBody.output.message.content[0].text ||
      '';

    console.log('[API Route] Extracted mermaid length:', generatedMermaid.length);

    if (!generatedMermaid) {
      console.error('[API Route] Failed to extract Mermaid from response:', responseBody);
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

    console.log('[API Route] Cleaned mermaid preview:', cleanedMermaid.substring(0, 100));

    // Validate that it starts with the expected diagram type
    const expectedStart = diagramType === 'bpmn'
      ? 'flowchart'
      : diagramType === 'class'
      ? 'classDiagram'
      : 'sequenceDiagram';

    if (!cleanedMermaid.startsWith(expectedStart)) {
      console.error(`[API Route] Generated content does not start with "${expectedStart}":`, cleanedMermaid);
      return Response.json(
        {
          success: false,
          error: `Generated diagram is not in valid Mermaid ${diagramType} format`,
        },
        { status: 500 }
      );
    }

    console.log('[API Route] Successfully generated and validated mermaid diagram');
    return Response.json({
      success: true,
      mermaid: cleanedMermaid,
    });
  } catch (error) {
    console.error('Error generating Mermaid diagram:', error);

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

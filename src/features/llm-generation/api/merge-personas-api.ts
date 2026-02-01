/**
 * Client-side API wrapper for LLM-based persona merging
 * Calls tinkersaur-api which proxies to tinkersaur-ai
 */

import { httpClient, ApiError } from '@/shared/api';
import { logger } from '@/shared/lib/utils';
import type { MergedPersonaData, Persona } from '@/entities/persona';

export interface PersonaInput {
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

export interface MergePersonasResponse {
  success: boolean;
  persona?: MergedPersonaData;
  error?: string;
}

/**
 * Custom error class for persona merge failures
 */
export class MergePersonasAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'MergePersonasAPIError';
  }
}

/**
 * Convert personas to the input format expected by the API
 */
function toPersonaInput(persona: Persona | PersonaInput): PersonaInput {
  return {
    name: persona.name,
    role: persona.role,
    description: persona.description,
    goals: persona.goals,
    painPoints: persona.painPoints,
    demographics: persona.demographics,
  };
}

/**
 * Merge multiple personas using AWS Bedrock LLM
 *
 * @param personas - Array of personas to merge
 * @param teamId - The team ID for authorization
 * @param instructions - Optional instructions for the merge
 * @returns Promise that resolves to the merged persona data
 * @throws MergePersonasAPIError if merge fails
 */
export async function mergePersonas(
  personas: (Persona | PersonaInput)[],
  teamId: string,
  instructions?: string
): Promise<MergedPersonaData> {
  logger.debug('mergePersonas called', {
    personaCount: personas.length,
    teamId,
    hasInstructions: !!instructions,
  });

  try {
    const personaInputs = personas.map(toPersonaInput);

    const data = await httpClient.post<MergePersonasResponse>(
      `/api/ai/merge-personas?teamId=${teamId}`,
      {
        personas: personaInputs,
        ...(instructions && { instructions }),
      }
    );

    if (!data.success) {
      throw new MergePersonasAPIError(
        data.error || 'Failed to merge personas',
        500
      );
    }

    if (!data.persona) {
      throw new MergePersonasAPIError(
        'No merged persona returned from API',
        500
      );
    }

    return data.persona;
  } catch (error) {
    logger.error('Exception in mergePersonas', error);

    if (error instanceof MergePersonasAPIError) {
      throw error;
    }

    if (error instanceof ApiError) {
      throw new MergePersonasAPIError(error.message, error.status);
    }

    throw new MergePersonasAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

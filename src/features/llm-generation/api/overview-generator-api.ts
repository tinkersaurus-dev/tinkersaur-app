/**
 * Client-side API wrapper for solution factor generation
 * Calls tinkersaur-api which proxies to tinkersaur-ai
 */

import { httpClient, ApiError } from '@/shared/api';
import { logger } from '@/shared/lib/utils';
import type { SolutionFactorType } from '@/entities/solution-factor';

export interface SolutionContext {
  name: string;
  description: string;
  type: string;
}

export interface PersonaContext {
  name: string;
  role: string;
  description: string;
  goals: string[];
  painPoints: string[];
}

export interface UseCaseContext {
  name: string;
  description: string;
  quotes: string[];
}

export interface FeedbackContext {
  type: string;
  content: string;
  quotes: string[];
}

export interface OutcomeContext {
  description: string;
  target: string;
}

export interface GeneratedFactorItem {
  content: string;
  notes: string;
}

export interface GenerateFactorsRequest {
  sectionType: SolutionFactorType;
  solutionContext: SolutionContext;
  personas: PersonaContext[];
  useCases: UseCaseContext[];
  feedback: FeedbackContext[];
  outcomes: OutcomeContext[];
  existingContent?: string;
  mode?: 'generate' | 'refine';
}

export interface GenerateFactorsResponse {
  success: boolean;
  content?: string;
  factors?: GeneratedFactorItem[];
  error?: string;
}

export class FactorGeneratorAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'FactorGeneratorAPIError';
  }
}

export async function generateFactors(
  request: GenerateFactorsRequest,
  teamId: string,
  _signal?: AbortSignal
): Promise<GeneratedFactorItem[]> {
  logger.debug('generateFactors called', {
    sectionType: request.sectionType,
    teamId,
    hasExistingContent: !!request.existingContent,
  });

  try {
    const data = await httpClient.post<GenerateFactorsResponse>(
      `/api/ai/generate-overview-section?teamId=${teamId}`,
      {
        sectionType: request.sectionType,
        personas: request.personas,
        useCases: request.useCases,
        feedback: request.feedback,
        outcomes: request.outcomes,
      }
    );

    if (!data.success) {
      throw new FactorGeneratorAPIError(
        data.error || 'Failed to generate factors',
        500
      );
    }

    // Handle both content (string) and factors (array) response formats
    if (data.content) {
      return [{ content: data.content, notes: '' }];
    }

    if (!data.factors || data.factors.length === 0) {
      throw new FactorGeneratorAPIError('No factors returned from API', 500);
    }

    return data.factors;
  } catch (error) {
    if (error instanceof FactorGeneratorAPIError) throw error;

    if (error instanceof ApiError) {
      throw new FactorGeneratorAPIError(error.message, error.status);
    }

    throw new FactorGeneratorAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

// Backwards compatibility aliases
export type OverviewSectionType = SolutionFactorType;
export type GenerateOverviewSectionRequest = GenerateFactorsRequest;
export type GenerateOverviewSectionResponse = GenerateFactorsResponse;
export const OverviewGeneratorAPIError = FactorGeneratorAPIError;

// Legacy function that returns a single string (first factor's content)
export async function generateOverviewSection(
  request: GenerateFactorsRequest,
  teamId: string,
  signal?: AbortSignal
): Promise<string> {
  const factors = await generateFactors(request, teamId, signal);
  return factors.map((f) => f.content).join('\n\n');
}

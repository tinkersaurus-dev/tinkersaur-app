/**
 * Client-side API wrapper for solution factor generation
 */

import { logger } from '~/core/utils/logger';
import type { SolutionFactorType } from '~/core/entities/product-management/types';

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
  /** Mode: 'generate' for bulk generation, 'refine' for single-factor refinement */
  mode?: 'generate' | 'refine';
}

export interface GenerateFactorsResponse {
  success: boolean;
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
  signal?: AbortSignal
): Promise<GeneratedFactorItem[]> {
  logger.debug('generateFactors called', {
    sectionType: request.sectionType,
    hasExistingContent: !!request.existingContent,
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 120000);

    const response = await fetch('/api/generate-overview-section', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: signal || controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    const data: GenerateFactorsResponse = await response.json();

    if (!response.ok || !data.success) {
      throw new FactorGeneratorAPIError(
        data.error || `Failed to generate factors (HTTP ${response.status})`,
        response.status
      );
    }

    if (!data.factors || data.factors.length === 0) {
      throw new FactorGeneratorAPIError('No factors returned from API', 500);
    }

    return data.factors;
  } catch (error) {
    if (error instanceof FactorGeneratorAPIError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new FactorGeneratorAPIError('Request was cancelled', 0);
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
  signal?: AbortSignal
): Promise<string> {
  const factors = await generateFactors(request, signal);
  return factors.map((f) => f.content).join('\n\n');
}

/**
 * Client-side API wrapper for overview section generation
 */

import { logger } from '~/core/utils/logger';
import type { OverviewSectionType } from './prompts/overview-prompts';

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

export interface GenerateOverviewSectionRequest {
  sectionType: OverviewSectionType;
  solutionContext: SolutionContext;
  personas: PersonaContext[];
  useCases: UseCaseContext[];
  feedback: FeedbackContext[];
  outcomes: OutcomeContext[];
  existingContent?: string;
}

export interface GenerateOverviewSectionResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export class OverviewGeneratorAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'OverviewGeneratorAPIError';
  }
}

export async function generateOverviewSection(
  request: GenerateOverviewSectionRequest,
  signal?: AbortSignal
): Promise<string> {
  logger.debug('generateOverviewSection called', {
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

    const data: GenerateOverviewSectionResponse = await response.json();

    if (!response.ok || !data.success) {
      throw new OverviewGeneratorAPIError(
        data.error || `Failed to generate section (HTTP ${response.status})`,
        response.status
      );
    }

    if (!data.content) {
      throw new OverviewGeneratorAPIError('No content returned from API', 500);
    }

    return data.content;
  } catch (error) {
    if (error instanceof OverviewGeneratorAPIError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new OverviewGeneratorAPIError('Request was cancelled', 0);
    }
    throw new OverviewGeneratorAPIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

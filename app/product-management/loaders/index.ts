/**
 * Route loaders for product management SSR data fetching
 */

import { ssrHttpClient, SsrApiError } from '~/core/api/ssrHttpClient';
import { deserializeDates, deserializeDatesArray } from '~/core/api/httpClient';
import type { Solution, UseCase, Persona, Requirement } from '~/core/entities/product-management';

// ============== TYPES ==============

export interface SolutionDetailLoaderData {
  solution: Solution;
  useCases: UseCase[];
}

export interface UseCaseDetailLoaderData {
  solution: Solution;
  useCase: UseCase;
  requirements: Requirement[];
}

export interface PersonaDetailLoaderData {
  persona: Persona;
}

// ============== LOADERS ==============

/**
 * Load solution and its use cases for solution-detail page
 */
export async function loadSolutionDetail(solutionId: string): Promise<SolutionDetailLoaderData> {
  try {
    // Fetch solution and use cases in parallel
    const [solutionData, useCasesData] = await Promise.all([
      ssrHttpClient.get<Solution>(`/api/solutions/${solutionId}`),
      ssrHttpClient.get<UseCase[]>(`/api/use-cases?solutionId=${solutionId}`),
    ]);

    return {
      solution: deserializeDates(solutionData),
      useCases: deserializeDatesArray(useCasesData),
    };
  } catch (error) {
    if (error instanceof SsrApiError && error.status === 404) {
      throw new Response('Solution not found', { status: 404 });
    }
    throw error;
  }
}

/**
 * Load use case, its parent solution, and requirements for use-case-detail page
 */
export async function loadUseCaseDetail(
  solutionId: string,
  useCaseId: string
): Promise<UseCaseDetailLoaderData> {
  try {
    // Parallel fetch for better performance
    const [solutionData, useCaseData, requirementsData] = await Promise.all([
      ssrHttpClient.get<Solution>(`/api/solutions/${solutionId}`),
      ssrHttpClient.get<UseCase>(`/api/use-cases/${useCaseId}`),
      ssrHttpClient.get<Requirement[]>(`/api/requirements?useCaseId=${useCaseId}`),
    ]);

    return {
      solution: deserializeDates(solutionData),
      useCase: deserializeDates(useCaseData),
      requirements: deserializeDatesArray(requirementsData),
    };
  } catch (error) {
    if (error instanceof SsrApiError && error.status === 404) {
      throw new Response('Resource not found', { status: 404 });
    }
    throw error;
  }
}

/**
 * Load persona for persona-detail page
 */
export async function loadPersonaDetail(personaId: string): Promise<PersonaDetailLoaderData> {
  try {
    const personaData = await ssrHttpClient.get<Persona>(`/api/personas/${personaId}`);

    return {
      persona: deserializeDates(personaData),
    };
  } catch (error) {
    if (error instanceof SsrApiError && error.status === 404) {
      throw new Response('Persona not found', { status: 404 });
    }
    throw error;
  }
}

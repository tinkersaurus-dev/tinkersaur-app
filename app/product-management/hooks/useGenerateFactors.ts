/**
 * Hook for generating solution factors using LLM
 * Fetches solution context and invokes the generation API
 */

import { useState, useCallback, useRef } from 'react';
import { usePersonasQuery, useUseCasesBySolutionQuery } from '../queries';
import { useFeedbacksPaginatedQuery, useOutcomesPaginatedQuery } from '~/discovery/queries';
import {
  generateFactors,
  type GenerateFactorsRequest,
  type GeneratedFactorItem,
  FactorGeneratorAPIError,
} from '@/features/llm-generation';
import type { Solution } from '@/entities/solution';
import type { SolutionFactorType } from '@/entities/solution-factor';

interface UseGenerateFactorsOptions {
  solution: Solution | undefined;
  teamId: string;
}

export function useGenerateFactors({
  solution,
  teamId,
}: UseGenerateFactorsOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFactors, setGeneratedFactors] = useState<GeneratedFactorItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch context data (these may already be cached from other parts of the app)
  // Pass undefined to disable queries when solution is not yet loaded
  const { data: personas = [] } = usePersonasQuery(teamId || undefined);
  const { data: useCases = [] } = useUseCasesBySolutionQuery(solution?.id);
  const { data: feedbackData } = useFeedbacksPaginatedQuery(
    solution?.id
      ? {
          teamId,
          solutionId: solution.id,
          pageSize: 100, // Get comprehensive feedback for context
        }
      : null
  );
  const { data: outcomesData } = useOutcomesPaginatedQuery(
    solution?.id
      ? {
          teamId,
          solutionId: solution.id,
          pageSize: 100,
        }
      : null
  );

  const generate = useCallback(
    async (factorType: SolutionFactorType, existingContent?: string) => {
      if (!solution) {
        setError('Solution not loaded');
        return [];
      }

      setIsGenerating(true);
      setError(null);
      setGeneratedFactors(null);

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        const request: GenerateFactorsRequest = {
          sectionType: factorType,
          solutionContext: {
            name: solution.name,
            description: solution.description,
            type: solution.type,
          },
          personas: personas.map((p) => ({
            name: p.name,
            role: p.role,
            description: p.description,
            goals: p.goals,
            painPoints: p.painPoints,
          })),
          useCases: useCases.map((uc) => ({
            name: uc.name,
            description: uc.description,
            quotes: uc.quotes.map((q) => q.content),
          })),
          feedback: (feedbackData?.items || []).map((f) => ({
            type: f.type,
            content: f.content,
            quotes: f.quotes.map((q) => q.content),
          })),
          outcomes: (outcomesData?.items || []).map((o) => ({
            description: o.description,
            target: o.target,
          })),
          existingContent: existingContent?.trim() || undefined,
        };

        const factors = await generateFactors(
          request,
          teamId,
          abortControllerRef.current.signal
        );
        setGeneratedFactors(factors);
        return factors;
      } catch (err) {
        const message =
          err instanceof FactorGeneratorAPIError
            ? err.message
            : 'Failed to generate factors';
        setError(message);
        throw err;
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    },
    [solution, teamId, personas, useCases, feedbackData, outcomesData]
  );

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
  }, []);

  const reset = useCallback(() => {
    setGeneratedFactors(null);
    setError(null);
  }, []);

  return {
    generate,
    cancel,
    reset,
    isGenerating,
    generatedFactors,
    error,
  };
}

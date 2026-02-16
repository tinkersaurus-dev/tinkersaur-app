/**
 * Hook for refining a single solution factor using LLM
 * Supports both refining existing content and generating from instructions alone
 */

import { useState, useCallback, useRef } from 'react';
import { usePersonasQuery, type Persona } from '@/entities/persona';
import { useUseCasesBySolutionQuery, type UseCase } from '@/entities/use-case';
import { useFeedbacksPaginatedQuery } from '@/entities/feedback';
import { useOutcomesPaginatedQuery } from '@/entities/outcome';
import {
  generateFactors,
  type GenerateFactorsRequest,
  FactorGeneratorAPIError,
} from '@/features/llm-generation';
import type { Solution } from '@/entities/solution';
import type { SolutionFactorType } from '@/entities/solution-factor';

interface UseRefineFactorOptions {
  solution: Solution | undefined;
  teamId: string;
}

interface RefineFactorParams {
  factorType: SolutionFactorType;
  currentContent: string;
  refinementInstructions: string;
}

/**
 * Builds the existingContent payload for refinement requests
 * Format differs based on whether there's a draft to refine or just instructions
 */
function buildRefinementPayload(currentContent: string, instructions: string): string {
  const trimmedContent = currentContent.trim();
  const trimmedInstructions = instructions.trim();

  if (!trimmedContent && trimmedInstructions) {
    // Generate from scratch case - no draft provided
    return `INSTRUCTIONS: ${trimmedInstructions}\n\nNo existing draft provided. Generate a single item based on the instructions above.`;
  }

  if (trimmedContent && !trimmedInstructions) {
    // This shouldn't happen (button disabled), but handle gracefully
    return `DRAFT TO REFINE:\n${trimmedContent}`;
  }

  // Both content and instructions - refinement case
  return `DRAFT TO REFINE:\n${trimmedContent}\n\nREFINEMENT INSTRUCTIONS:\n${trimmedInstructions}`;
}

export function useRefineFactor({ solution, teamId }: UseRefineFactorOptions) {
  const [isRefining, setIsRefining] = useState(false);
  const [refinedContent, setRefinedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch context data (these may already be cached from other parts of the app)
  const { data: personas = [] } = usePersonasQuery(teamId || undefined);
  const { data: useCases = [] } = useUseCasesBySolutionQuery(solution?.id);
  const { data: feedbackData } = useFeedbacksPaginatedQuery(
    solution?.id
      ? {
          teamId,
          solutionId: solution.id,
          pageSize: 100,
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

  const refine = useCallback(
    async ({ factorType, currentContent, refinementInstructions }: RefineFactorParams) => {
      if (!solution) {
        setError('Solution not loaded');
        return null;
      }

      if (!refinementInstructions.trim()) {
        setError('Refinement instructions are required');
        return null;
      }

      setIsRefining(true);
      setError(null);
      setRefinedContent(null);

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        const existingContentPayload = buildRefinementPayload(
          currentContent,
          refinementInstructions
        );

        const request: GenerateFactorsRequest = {
          sectionType: factorType,
          solutionContext: {
            name: solution.name,
            description: solution.description,
            type: solution.type,
          },
          personas: personas.map((p: Persona) => ({
            name: p.name,
            role: p.role,
            description: p.description,
            goals: p.goals,
            painPoints: p.painPoints,
          })),
          useCases: useCases.map((uc: UseCase) => ({
            name: uc.name,
            description: uc.description,
            quotes: uc.quotes.map((q: { content: string }) => q.content),
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
          existingContent: existingContentPayload,
          mode: 'refine',
        };

        const factors = await generateFactors(request, teamId, abortControllerRef.current.signal);

        // Take the first (and should be only) factor's content
        const content = factors[0]?.content || '';
        setRefinedContent(content);
        return content;
      } catch (err) {
        const message =
          err instanceof FactorGeneratorAPIError ? err.message : 'Failed to refine factor';
        setError(message);
        throw err;
      } finally {
        setIsRefining(false);
        abortControllerRef.current = null;
      }
    },
    [solution, teamId, personas, useCases, feedbackData, outcomesData]
  );

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsRefining(false);
  }, []);

  const reset = useCallback(() => {
    setRefinedContent(null);
    setError(null);
  }, []);

  return {
    refine,
    cancel,
    reset,
    isRefining,
    refinedContent,
    error,
  };
}

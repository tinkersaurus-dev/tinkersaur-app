/**
 * Hook for generating overview sections using LLM
 * Fetches solution context and invokes the generation API
 */

import { useState, useCallback, useRef } from 'react';
import { usePersonasQuery, useUseCasesBySolutionQuery } from '../queries';
import { useFeedbacksPaginatedQuery, useOutcomesPaginatedQuery } from '~/discovery/queries';
import {
  generateOverviewSection,
  type GenerateOverviewSectionRequest,
  OverviewGeneratorAPIError,
} from '~/design-studio/lib/llm/overview-generator-api';
import type { Solution } from '~/core/entities/product-management/types';
import type { OverviewSectionType } from '~/design-studio/lib/llm/prompts/overview-prompts';

interface UseGenerateOverviewSectionOptions {
  solution: Solution | undefined;
  teamId: string;
}

export function useGenerateOverviewSection({
  solution,
  teamId,
}: UseGenerateOverviewSectionOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
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
    async (sectionType: OverviewSectionType, existingContent?: string) => {
      if (!solution) {
        setError('Solution not loaded');
        return '';
      }

      setIsGenerating(true);
      setError(null);
      setGeneratedContent(null);

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        const request: GenerateOverviewSectionRequest = {
          sectionType,
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
            quotes: uc.quotes,
          })),
          feedback: (feedbackData?.items || []).map((f) => ({
            type: f.type,
            content: f.content,
            quotes: f.quotes,
          })),
          outcomes: (outcomesData?.items || []).map((o) => ({
            description: o.description,
            target: o.target,
          })),
          existingContent: existingContent?.trim() || undefined,
        };

        const content = await generateOverviewSection(
          request,
          abortControllerRef.current.signal
        );
        setGeneratedContent(content);
        return content;
      } catch (err) {
        const message =
          err instanceof OverviewGeneratorAPIError
            ? err.message
            : 'Failed to generate content';
        setError(message);
        throw err;
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    },
    [solution, personas, useCases, feedbackData, outcomesData]
  );

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
  }, []);

  const reset = useCallback(() => {
    setGeneratedContent(null);
    setError(null);
  }, []);

  return {
    generate,
    cancel,
    reset,
    isGenerating,
    generatedContent,
    error,
  };
}

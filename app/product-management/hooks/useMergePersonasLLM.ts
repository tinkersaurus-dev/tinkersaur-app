/**
 * Hook for merging personas using the LLM API
 * Sends personas to Bedrock for intelligent merging
 */

import { useFetcher } from 'react-router';
import { useCallback, useRef } from 'react';
import type { MergedPersonaData, Persona } from '~/core/entities/product-management/types';

interface PersonaInput {
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

interface MergePersonasLLMResponse {
  success: boolean;
  mergedPersona?: MergedPersonaData;
  error?: string;
}

export function useMergePersonasLLM() {
  const fetcher = useFetcher<MergePersonasLLMResponse>();
  const lastSubmitKey = useRef<string | null>(null);

  const isLoading = fetcher.state === 'submitting' || fetcher.state === 'loading';

  const merge = useCallback(
    (personas: Persona[] | PersonaInput[], instructions?: string) => {
      // Convert personas to input format
      const personaInputs: PersonaInput[] = personas.map((p) => ({
        name: p.name,
        role: p.role,
        description: p.description,
        goals: p.goals,
        painPoints: p.painPoints,
        demographics: p.demographics,
      }));

      // Track the submission to help with reset logic
      lastSubmitKey.current = Date.now().toString();

      fetcher.submit(
        JSON.stringify({
          personas: personaInputs,
          ...(instructions && { instructions }),
        }),
        {
          method: 'POST',
          action: '/api/merge-personas',
          encType: 'application/json',
        }
      );
    },
    [fetcher]
  );

  const reset = useCallback(() => {
    lastSubmitKey.current = null;
  }, []);

  // Derive result and error directly from fetcher data
  const result = fetcher.data?.success ? fetcher.data.mergedPersona : null;
  const error = fetcher.data?.success === false ? fetcher.data.error : null;

  return {
    merge,
    reset,
    isLoading,
    result,
    error,
  };
}

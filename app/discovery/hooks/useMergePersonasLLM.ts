/**
 * Hook for merging personas using the LLM API
 * Sends personas to Bedrock for intelligent merging
 */

import { createLLMMergeHook } from './createLLMMergeHook';
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

export const useMergePersonasLLM = createLLMMergeHook<PersonaInput, Persona | PersonaInput, MergedPersonaData>({
  endpoint: '/api/ai/merge-personas',
  itemsFieldName: 'personas',
  toInput: (p) => ({
    name: p.name,
    role: p.role,
    description: p.description,
    goals: p.goals,
    painPoints: p.painPoints,
    demographics: p.demographics,
  }),
  getMergedResult: (response) => response.persona as MergedPersonaData | undefined,
});

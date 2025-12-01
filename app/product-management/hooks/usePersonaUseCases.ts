/**
 * PersonaUseCase hooks - Data access for persona-usecase relationships
 */

import { useEffect } from 'react';
import { usePersonaUseCaseStore } from '~/core/entities/product-management';

/**
 * Hook to fetch and access all use case links for a persona
 */
export function usePersonaUseCases(personaId: string) {
  const personaUseCases = usePersonaUseCaseStore((state) => state.personaUseCases);
  const loading = usePersonaUseCaseStore((state) => state.loading);
  const error = usePersonaUseCaseStore((state) => state.error);
  const fetchByPersona = usePersonaUseCaseStore((state) => state.fetchByPersona);
  const getUseCaseIdsForPersona = usePersonaUseCaseStore((state) => state.getUseCaseIdsForPersona);

  useEffect(() => {
    fetchByPersona(personaId);
  }, [personaId, fetchByPersona]);

  const useCaseIds = getUseCaseIdsForPersona(personaId);

  return { personaUseCases, useCaseIds, loading, error };
}

/**
 * Hook to fetch and access all persona links for a use case
 */
export function useUseCasePersonas(useCaseId: string) {
  const personaUseCases = usePersonaUseCaseStore((state) => state.personaUseCases);
  const loading = usePersonaUseCaseStore((state) => state.loading);
  const error = usePersonaUseCaseStore((state) => state.error);
  const fetchByUseCase = usePersonaUseCaseStore((state) => state.fetchByUseCase);
  const getPersonaIdsForUseCase = usePersonaUseCaseStore((state) => state.getPersonaIdsForUseCase);

  useEffect(() => {
    fetchByUseCase(useCaseId);
  }, [useCaseId, fetchByUseCase]);

  const personaIds = getPersonaIdsForUseCase(useCaseId);

  return { personaUseCases, personaIds, loading, error };
}

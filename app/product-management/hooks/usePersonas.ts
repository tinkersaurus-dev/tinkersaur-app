/**
 * Personas hooks - Data access for personas
 */

import { useEffect } from 'react';
import { usePersonaStore } from '~/core/entities/product-management';

/**
 * Hook to fetch and access all personas for a team
 */
export function usePersonas(teamId: string) {
  const personas = usePersonaStore((state) => state.entities);
  const loading = usePersonaStore((state) => state.loading);
  const error = usePersonaStore((state) => state.error);
  const fetchPersonas = usePersonaStore((state) => state.fetchPersonas);

  useEffect(() => {
    fetchPersonas(teamId);
  }, [teamId, fetchPersonas]);

  return { personas, loading, error };
}

/**
 * Hook to access a single persona by ID
 */
export function usePersona(personaId: string | undefined) {
  const persona = usePersonaStore((state) =>
    personaId ? state.entities.find((p) => p.id === personaId) : undefined
  );
  const loading = usePersonaStore((state) => state.loading);
  const error = usePersonaStore((state) => state.error);

  return { persona, loading, error };
}

/**
 * Hydrate Zustand stores with loader data for client-side navigation continuity
 */

import { useEffect, useRef } from 'react';
import { useSolutionStore, usePersonaStore } from '~/core/entities/product-management';
import { useUseCaseStore } from '~/core/entities/product-management/store/useCase/useUseCaseStore';
import type { Solution, UseCase, Persona } from '~/core/entities/product-management';

/**
 * Hook to hydrate solution store with loader data
 * Only hydrates once on mount to avoid overwriting client-side updates
 */
export function useHydrateSolution(solution: Solution) {
  const setEntities = useSolutionStore((state) => state.setEntities);
  const entities = useSolutionStore((state) => state.entities);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!hydrated.current) {
      // Check if solution is not already in store
      const exists = entities.some(s => s.id === solution.id);
      if (!exists) {
        setEntities([...entities, solution]);
      }
      hydrated.current = true;
    }
  }, [solution, entities, setEntities]);
}

/**
 * Hook to hydrate use cases store with loader data
 */
export function useHydrateUseCases(useCases: UseCase[]) {
  const setEntities = useUseCaseStore((state) => state.setEntities);
  const entities = useUseCaseStore((state) => state.entities);
  const hydrated = useRef(false);

  useEffect(() => {
    if (useCases.length > 0 && !hydrated.current) {
      // Merge without duplicates
      const existingIds = new Set(entities.map(uc => uc.id));
      const newUseCases = useCases.filter(uc => !existingIds.has(uc.id));
      if (newUseCases.length > 0) {
        setEntities([...entities, ...newUseCases]);
      }
      hydrated.current = true;
    }
  }, [useCases, entities, setEntities]);
}

/**
 * Hook to hydrate use case store with single entity
 */
export function useHydrateUseCase(useCase: UseCase) {
  const setEntities = useUseCaseStore((state) => state.setEntities);
  const entities = useUseCaseStore((state) => state.entities);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!hydrated.current) {
      const exists = entities.some(uc => uc.id === useCase.id);
      if (!exists) {
        setEntities([...entities, useCase]);
      }
      hydrated.current = true;
    }
  }, [useCase, entities, setEntities]);
}

/**
 * Hook to hydrate persona store with loader data
 */
export function useHydratePersona(persona: Persona) {
  const setEntities = usePersonaStore((state) => state.setEntities);
  const entities = usePersonaStore((state) => state.entities);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!hydrated.current) {
      const exists = entities.some(p => p.id === persona.id);
      if (!exists) {
        setEntities([...entities, persona]);
      }
      hydrated.current = true;
    }
  }, [persona, entities, setEntities]);
}

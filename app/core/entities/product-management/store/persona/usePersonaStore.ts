import { personaApi } from '../../api';
import type { Persona, CreatePersonaDto } from '../../types';
import { createStoreWrapper } from '../createStoreWrapper';

/**
 * Zustand store for managing Persona entities
 *
 * Provides CRUD operations and cascade delete functionality.
 * When a persona is deleted, all associated persona-usecase links are also deleted.
 */
export const usePersonaStore = createStoreWrapper<Persona, CreatePersonaDto, {
  fetchPersonas: (teamId: string) => Promise<void>;
  fetchPersona: (id: string) => Promise<Persona | null>;
}>({
  api: personaApi,
  entityName: 'Persona',

  deleteHandler: async (id, baseStore, api) => {
    // Import store lazily to avoid circular dependency
    const { usePersonaUseCaseStore } = await import('../personaUseCase/usePersonaUseCaseStore');
    const personaUseCaseStore = usePersonaUseCaseStore.getState();

    // Delete all persona-usecase links for this persona
    await personaUseCaseStore.deleteByPersonaId(id);

    // Delete the persona itself
    const success = await api.delete(id);

    if (success) {
      const currentEntities = baseStore.getState().entities;
      baseStore.setState({
        entities: currentEntities.filter(p => p.id !== id),
      });
    }

    return success;
  },

  extensions: (baseStore) => ({
    fetchPersonas: (...args) => baseStore.getState().fetchAll(...args),
    fetchPersona: (...args) => baseStore.getState().fetchById(...args),
  }),
});

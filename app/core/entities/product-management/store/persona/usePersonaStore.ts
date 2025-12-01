import { create } from 'zustand';
import { personaApi } from '../../api';
import type { Persona, CreatePersonaDto } from '../../types';
import { createEntityStore } from '../createEntityStore';
import type { EntityStore } from '../createEntityStore';
import { toast } from 'sonner';

/**
 * Zustand store for managing Persona entities
 *
 * Provides CRUD operations and cascade delete functionality.
 * When a persona is deleted, all associated persona-usecase links are also deleted.
 */
const baseStore = createEntityStore<Persona, CreatePersonaDto>(
  personaApi,
  'Persona'
);

// Create a new store that wraps the base store and adds convenience methods
export const usePersonaStore = create<EntityStore<Persona, CreatePersonaDto> & {
  fetchPersonas: (teamId: string) => Promise<void>;
  fetchPersona: (id: string) => Promise<Persona | null>;
}>((_set, _get) => ({
  // Proxy all base store state
  get entities() { return baseStore.getState().entities; },
  get loading() { return baseStore.getState().loading; },
  get error() { return baseStore.getState().error; },

  // Proxy base store methods (with dynamic references)
  fetchAll: (...args) => baseStore.getState().fetchAll(...args),
  fetchById: (...args) => baseStore.getState().fetchById(...args),
  create: (...args) => baseStore.getState().create(...args),
  update: (...args) => baseStore.getState().update(...args),
  setEntities: (...args) => baseStore.getState().setEntities(...args),
  reset: () => baseStore.getState().reset(),

  // Convenience method aliases
  fetchPersonas: (...args) => baseStore.getState().fetchAll(...args),
  fetchPersona: (...args) => baseStore.getState().fetchById(...args),

  // Override delete method with cascade logic
  delete: async (id: string): Promise<boolean> => {
    // Import store lazily to avoid circular dependency
    const { usePersonaUseCaseStore } = await import('../personaUseCase/usePersonaUseCaseStore');

    const personaUseCaseStore = usePersonaUseCaseStore.getState();

    baseStore.setState({ loading: true, error: null });

    try {
      // Delete all persona-usecase links for this persona
      await personaUseCaseStore.deleteByPersonaId(id);

      // Finally, delete the persona itself
      const success = await personaApi.delete(id);

      if (success) {
        const currentEntities = baseStore.getState().entities;
        baseStore.setState({
          entities: currentEntities.filter(p => p.id !== id),
          loading: false
        });
        toast.success('Persona deleted successfully');
      } else {
        baseStore.setState({ loading: false });
        toast.error('Failed to delete persona');
      }

      return success;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete persona');
      baseStore.setState({ error: err, loading: false });
      toast.error('Failed to delete persona');
      return false;
    }
  },
}));

// Subscribe to base store changes to keep our wrapper in sync
baseStore.subscribe((state) => {
  usePersonaStore.setState({
    entities: state.entities,
    loading: state.loading,
    error: state.error,
  } as Partial<ReturnType<typeof usePersonaStore.getState>>);
});

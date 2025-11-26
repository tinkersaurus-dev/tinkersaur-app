import { create } from 'zustand';
import { useCaseApi } from '../../api';
import type { UseCase, CreateUseCaseDto } from '../../types';
import { createEntityStore } from '../createEntityStore';
import type { EntityStore } from '../createEntityStore';
import { toast } from 'sonner';

/**
 * Zustand store for managing UseCase entities
 *
 * Provides CRUD operations and relationship queries.
 * When a use case is deleted, all associated changes and requirements are also deleted.
 */
const baseStore = createEntityStore<UseCase, CreateUseCaseDto>(
  useCaseApi,
  'UseCase'
);

// Create a new store that wraps the base store and adds convenience methods
export const useUseCaseStore = create<EntityStore<UseCase, CreateUseCaseDto> & {
  getUseCasesBySolutionId: (solutionId: string) => UseCase[];
  fetchUseCasesBySolution: (solutionId: string) => Promise<void>;
  createUseCase: (data: CreateUseCaseDto) => Promise<UseCase | null>;
  updateUseCase: (id: string, updates: Partial<UseCase>) => Promise<UseCase | null>;
  deleteUseCase: (id: string) => Promise<boolean>;
}>((_set, get) => ({
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
  fetchUseCasesBySolution: (...args) => baseStore.getState().fetchAll(...args),
  createUseCase: (...args) => baseStore.getState().create(...args),
  updateUseCase: (...args) => baseStore.getState().update(...args),

  // Relationship query method
  getUseCasesBySolutionId: (solutionId: string): UseCase[] => {
    return baseStore.getState().entities.filter(u => u.solutionId === solutionId);
  },

  // Override delete method with cascade logic
  delete: async (id: string): Promise<boolean> => {
    // Import here to avoid circular dependency
    const { useChangeStore } = await import('../change/useChangeStore');
    const { useRequirementStore } = await import('../requirement/useRequirementStore');

    const changeStore = useChangeStore.getState();
    const requirementStore = useRequirementStore.getState();

    baseStore.setState({ loading: true, error: null });

    try {
      // Get all changes for this use case
      const changes = changeStore.entities.filter(c => c.useCaseId === id);

      // Delete all requirements for each change
      for (const change of changes) {
        const requirements = requirementStore.entities.filter(r => r.changeId === change.id);
        for (const requirement of requirements) {
          await requirementStore.delete(requirement.id);
        }
      }

      // Delete all changes for this use case
      for (const change of changes) {
        await changeStore.delete(change.id);
      }

      // Finally, delete the use case itself
      const success = await useCaseApi.delete(id);

      if (success) {
        const currentEntities = baseStore.getState().entities;
        baseStore.setState({
          entities: currentEntities.filter(u => u.id !== id),
          loading: false
        });
        toast.success('Use case deleted successfully');
      } else {
        baseStore.setState({ loading: false });
        toast.error('Failed to delete use case');
      }

      return success;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete use case');
      baseStore.setState({ error: err, loading: false });
      toast.error('Failed to delete use case');
      return false;
    }
  },

  // deleteUseCase alias
  deleteUseCase: async (id: string) => get().delete(id),
}));

// Subscribe to base store changes to keep our wrapper in sync
baseStore.subscribe((state) => {
  useUseCaseStore.setState({
    entities: state.entities,
    loading: state.loading,
    error: state.error,
  } as Partial<ReturnType<typeof useUseCaseStore.getState>>);
});

import { create } from 'zustand';
import { solutionApi } from '../../api';
import type { Solution, CreateSolutionDto } from '../../types';
import { createEntityStore } from '../createEntityStore';
import type { EntityStore } from '../createEntityStore';
import { toast } from 'sonner';

/**
 * Zustand store for managing Solution entities
 *
 * Provides CRUD operations and cascade delete functionality.
 * When a solution is deleted, all associated use cases and requirements are also deleted.
 */
const baseStore = createEntityStore<Solution, CreateSolutionDto>(
  solutionApi,
  'Solution'
);

// Create a new store that wraps the base store and adds convenience methods
export const useSolutionStore = create<EntityStore<Solution, CreateSolutionDto> & {
  fetchSolutions: (teamId: string) => Promise<void>;
  fetchSolution: (id: string) => Promise<Solution | null>;
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
  fetchSolutions: (...args) => baseStore.getState().fetchAll(...args),
  fetchSolution: (...args) => baseStore.getState().fetchById(...args),

  // Override delete method with cascade logic
  delete: async (id: string): Promise<boolean> => {
    // Import stores lazily to avoid circular dependency
    const { useUseCaseStore } = await import('../useCase/useUseCaseStore');
    const { useRequirementStore } = await import('../requirement/useRequirementStore');

    const useCaseStore = useUseCaseStore.getState();
    const requirementStore = useRequirementStore.getState();

    baseStore.setState({ loading: true, error: null });

    try {
      // Get all use cases for this solution
      const useCases = useCaseStore.entities.filter(u => u.solutionId === id);

      // Cascade delete: Delete all use cases and their requirements
      for (const useCase of useCases) {
        // Get all requirements for this use case
        const requirements = requirementStore.entities.filter(r => r.useCaseId === useCase.id);

        // Delete all requirements
        for (const requirement of requirements) {
          await requirementStore.delete(requirement.id);
        }

        // Delete the use case
        await useCaseStore.delete(useCase.id);
      }

      // Finally, delete the solution itself
      const success = await solutionApi.delete(id);

      if (success) {
        const currentEntities = baseStore.getState().entities;
        baseStore.setState({
          entities: currentEntities.filter(s => s.id !== id),
          loading: false
        });
        toast.success('Solution deleted successfully');
      } else {
        baseStore.setState({ loading: false });
        toast.error('Failed to delete solution');
      }

      return success;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete solution');
      baseStore.setState({ error: err, loading: false });
      toast.error('Failed to delete solution');
      return false;
    }
  },
}));

// Subscribe to base store changes to keep our wrapper in sync
baseStore.subscribe((state) => {
  useSolutionStore.setState({
    entities: state.entities,
    loading: state.loading,
    error: state.error,
  } as Partial<ReturnType<typeof useSolutionStore.getState>>);
});

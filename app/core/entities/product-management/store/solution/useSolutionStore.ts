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
 * When a solution is deleted, all associated features, changes, and requirements are also deleted.
 */
const baseStore = createEntityStore<Solution, CreateSolutionDto>(
  solutionApi,
  'Solution'
);

// Create a new store that wraps the base store and adds convenience methods
export const useSolutionStore = create<EntityStore<Solution, CreateSolutionDto> & {
  fetchSolutions: (organizationId: string) => Promise<void>;
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
    const { useFeatureStore } = await import('../feature/useFeatureStore');
    const { useChangeStore } = await import('../change/useChangeStore');
    const { useRequirementStore } = await import('../requirement/useRequirementStore');

    const featureStore = useFeatureStore.getState();
    const changeStore = useChangeStore.getState();
    const requirementStore = useRequirementStore.getState();

    baseStore.setState({ loading: true, error: null });

    try {
      // Get all features for this solution
      const features = featureStore.entities.filter(f => f.solutionId === id);

      // Cascade delete: Delete all features (which will cascade to changes and requirements)
      for (const feature of features) {
        // Get all changes for this feature
        const changes = changeStore.entities.filter(c => c.featureId === feature.id);

        // Delete all requirements for each change
        for (const change of changes) {
          const requirements = requirementStore.entities.filter(r => r.changeId === change.id);
          for (const requirement of requirements) {
            await requirementStore.delete(requirement.id);
          }
        }

        // Delete all changes for this feature
        for (const change of changes) {
          await changeStore.delete(change.id);
        }

        // Delete the feature
        await featureStore.delete(feature.id);
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

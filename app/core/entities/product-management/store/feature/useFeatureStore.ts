import { create } from 'zustand';
import { featureApi } from '../../api';
import type { Feature, CreateFeatureDto } from '../../types';
import { createEntityStore } from '../createEntityStore';
import type { EntityStore } from '../createEntityStore';
import { toast } from 'sonner';

/**
 * Zustand store for managing Feature entities
 *
 * Provides CRUD operations and relationship queries.
 * When a feature is deleted, all associated changes and requirements are also deleted.
 */
const baseStore = createEntityStore<Feature, CreateFeatureDto>(
  featureApi,
  'Feature'
);

// Create a new store that wraps the base store and adds convenience methods
export const useFeatureStore = create<EntityStore<Feature, CreateFeatureDto> & {
  getFeaturesBySolutionId: (solutionId: string) => Feature[];
  fetchFeaturesBySolution: (solutionId: string) => Promise<void>;
  createFeature: (data: CreateFeatureDto) => Promise<Feature | null>;
  updateFeature: (id: string, updates: Partial<Feature>) => Promise<Feature | null>;
  deleteFeature: (id: string) => Promise<boolean>;
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
  fetchFeaturesBySolution: (...args) => baseStore.getState().fetchAll(...args),
  createFeature: (...args) => baseStore.getState().create(...args),
  updateFeature: (...args) => baseStore.getState().update(...args),

  // Relationship query method
  getFeaturesBySolutionId: (solutionId: string): Feature[] => {
    return baseStore.getState().entities.filter(f => f.solutionId === solutionId);
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
      // Get all changes for this feature
      const changes = changeStore.entities.filter(c => c.featureId === id);

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

      // Finally, delete the feature itself
      const success = await featureApi.delete(id);

      if (success) {
        const currentEntities = baseStore.getState().entities;
        baseStore.setState({
          entities: currentEntities.filter(f => f.id !== id),
          loading: false
        });
        toast.success('Feature deleted successfully');
      } else {
        baseStore.setState({ loading: false });
        toast.error('Failed to delete feature');
      }

      return success;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete feature');
      baseStore.setState({ error: err, loading: false });
      toast.error('Failed to delete feature');
      return false;
    }
  },

  // deleteFeature alias
  deleteFeature: async (id: string) => get().delete(id),
}));

// Subscribe to base store changes to keep our wrapper in sync
baseStore.subscribe((state) => {
  useFeatureStore.setState({
    entities: state.entities,
    loading: state.loading,
    error: state.error,
  } as Partial<ReturnType<typeof useFeatureStore.getState>>);
});

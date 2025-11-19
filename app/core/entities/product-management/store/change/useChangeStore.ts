import { create } from 'zustand';
import { changeApi } from '../../api';
import type { Change, CreateChangeDto } from '../../types';
import { createEntityStore } from '../createEntityStore';
import type { EntityStore } from '../createEntityStore';
import { toast } from 'sonner';

/**
 * Zustand store for managing Change entities
 *
 * Provides CRUD operations and relationship queries.
 * When a change is deleted, all associated requirements are also deleted.
 */
const baseStore = createEntityStore<Change, CreateChangeDto>(
  changeApi,
  'Change'
);

// Create a new store that wraps the base store and adds convenience methods
export const useChangeStore = create<EntityStore<Change, CreateChangeDto> & {
  getChangesByFeatureId: (featureId: string) => Change[];
  fetchChangesByFeature: (featureId: string) => Promise<void>;
  createChange: (data: CreateChangeDto) => Promise<Change | null>;
  updateChange: (id: string, updates: Partial<Change>) => Promise<Change | null>;
  deleteChange: (id: string) => Promise<boolean>;
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
  fetchChangesByFeature: (...args) => baseStore.getState().fetchAll(...args),
  createChange: (...args) => baseStore.getState().create(...args),
  updateChange: (...args) => baseStore.getState().update(...args),

  // Relationship query method
  getChangesByFeatureId: (featureId: string): Change[] => {
    return baseStore.getState().entities.filter(c => c.featureId === featureId);
  },

  // Override delete method with cascade logic
  delete: async (id: string): Promise<boolean> => {
    // Import here to avoid circular dependency
    const { useRequirementStore } = await import('../requirement/useRequirementStore');
    const requirementStore = useRequirementStore.getState();

    baseStore.setState({ loading: true, error: null });

    try {
      // Get all requirements for this change
      const requirements = requirementStore.entities.filter(r => r.changeId === id);

      // Delete all requirements
      for (const requirement of requirements) {
        await requirementStore.delete(requirement.id);
      }

      // Finally, delete the change itself
      const success = await changeApi.delete(id);

      if (success) {
        const currentEntities = baseStore.getState().entities;
        baseStore.setState({
          entities: currentEntities.filter(c => c.id !== id),
          loading: false
        });
        toast.success('Change deleted successfully');
      } else {
        baseStore.setState({ loading: false });
        toast.error('Failed to delete change');
      }

      return success;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete change');
      baseStore.setState({ error: err, loading: false });
      toast.error('Failed to delete change');
      return false;
    }
  },

  // deleteChange alias
  deleteChange: async (id: string) => get().delete(id),
}));

// Subscribe to base store changes to keep our wrapper in sync
baseStore.subscribe((state) => {
  useChangeStore.setState({
    entities: state.entities,
    loading: state.loading,
    error: state.error,
  } as Partial<ReturnType<typeof useChangeStore.getState>>);
});

import { create } from 'zustand';
import { organizationApi } from '../../api';
import type { Organization, CreateOrganizationDto } from '../../types';
import { createEntityStore } from '../createEntityStore';
import type { EntityStore } from '../createEntityStore';
import { toast } from 'sonner';

/**
 * Zustand store for managing Organization entities
 *
 * Provides CRUD operations and cascade delete functionality.
 * When an organization is deleted, all associated teams are also deleted,
 * which cascades to delete users, solutions, and personas.
 */
const baseStore = createEntityStore<Organization, CreateOrganizationDto>(
  organizationApi,
  'Organization'
);

// Create a new store that wraps the base store and adds convenience methods
export const useOrganizationStore = create<EntityStore<Organization, CreateOrganizationDto> & {
  fetchOrganizations: () => Promise<void>;
  fetchOrganization: (id: string) => Promise<Organization | null>;
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
  fetchOrganizations: () => baseStore.getState().fetchAll(),
  fetchOrganization: (...args) => baseStore.getState().fetchById(...args),

  // Override delete method with cascade logic
  delete: async (id: string): Promise<boolean> => {
    // Import team store lazily to avoid circular dependency
    const { useTeamStore } = await import('../team/useTeamStore');

    const teamStore = useTeamStore.getState();

    baseStore.setState({ loading: true, error: null });

    try {
      // Get all teams for this organization
      const teams = teamStore.entities.filter(t => t.organizationId === id);

      // Cascade delete: Delete all teams (which cascade to users, solutions, personas)
      for (const team of teams) {
        await teamStore.delete(team.id);
      }

      // Finally, delete the organization itself
      const success = await organizationApi.delete(id);

      if (success) {
        const currentEntities = baseStore.getState().entities;
        baseStore.setState({
          entities: currentEntities.filter(o => o.id !== id),
          loading: false
        });
        toast.success('Organization deleted successfully');
      } else {
        baseStore.setState({ loading: false });
        toast.error('Failed to delete organization');
      }

      return success;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete organization');
      baseStore.setState({ error: err, loading: false });
      toast.error('Failed to delete organization');
      return false;
    }
  },
}));

// Subscribe to base store changes to keep our wrapper in sync
baseStore.subscribe((state) => {
  useOrganizationStore.setState({
    entities: state.entities,
    loading: state.loading,
    error: state.error,
  } as Partial<ReturnType<typeof useOrganizationStore.getState>>);
});

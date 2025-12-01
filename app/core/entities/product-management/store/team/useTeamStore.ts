import { create } from 'zustand';
import { teamApi } from '../../api';
import type { Team, CreateTeamDto } from '../../types';
import { createEntityStore } from '../createEntityStore';
import type { EntityStore } from '../createEntityStore';
import { toast } from 'sonner';

/**
 * Zustand store for managing Team entities
 *
 * Provides CRUD operations and cascade delete functionality.
 * When a team is deleted, all associated users, solutions, and personas are also deleted.
 */
const baseStore = createEntityStore<Team, CreateTeamDto>(
  teamApi,
  'Team'
);

// Create a new store that wraps the base store and adds convenience methods
export const useTeamStore = create<EntityStore<Team, CreateTeamDto> & {
  fetchTeams: (organizationId: string) => Promise<void>;
  fetchTeam: (id: string) => Promise<Team | null>;
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
  fetchTeams: (...args) => baseStore.getState().fetchAll(...args),
  fetchTeam: (...args) => baseStore.getState().fetchById(...args),

  // Override delete method with cascade logic
  delete: async (id: string): Promise<boolean> => {
    // Import stores lazily to avoid circular dependency
    const { useUserStore } = await import('../user/useUserStore');
    const { useSolutionStore } = await import('../solution/useSolutionStore');
    const { usePersonaStore } = await import('../persona/usePersonaStore');

    const userStore = useUserStore.getState();
    const solutionStore = useSolutionStore.getState();
    const personaStore = usePersonaStore.getState();

    baseStore.setState({ loading: true, error: null });

    try {
      // Get all users for this team
      const users = userStore.entities.filter(u => u.teamId === id);
      // Get all solutions for this team
      const solutions = solutionStore.entities.filter(s => s.teamId === id);
      // Get all personas for this team
      const personas = personaStore.entities.filter(p => p.teamId === id);

      // Cascade delete: Delete all users (no children)
      for (const user of users) {
        await userStore.delete(user.id);
      }

      // Cascade delete: Delete all solutions (which cascade to use cases and requirements)
      for (const solution of solutions) {
        await solutionStore.delete(solution.id);
      }

      // Cascade delete: Delete all personas (which cascade to persona-use-case links)
      for (const persona of personas) {
        await personaStore.delete(persona.id);
      }

      // Finally, delete the team itself
      const success = await teamApi.delete(id);

      if (success) {
        const currentEntities = baseStore.getState().entities;
        baseStore.setState({
          entities: currentEntities.filter(t => t.id !== id),
          loading: false
        });
        toast.success('Team deleted successfully');
      } else {
        baseStore.setState({ loading: false });
        toast.error('Failed to delete team');
      }

      return success;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete team');
      baseStore.setState({ error: err, loading: false });
      toast.error('Failed to delete team');
      return false;
    }
  },
}));

// Subscribe to base store changes to keep our wrapper in sync
baseStore.subscribe((state) => {
  useTeamStore.setState({
    entities: state.entities,
    loading: state.loading,
    error: state.error,
  } as Partial<ReturnType<typeof useTeamStore.getState>>);
});

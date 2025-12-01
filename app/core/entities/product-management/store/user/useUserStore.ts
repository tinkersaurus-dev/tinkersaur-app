import { create } from 'zustand';
import { userApi } from '../../api';
import type { User, CreateUserDto } from '../../types';
import { createEntityStore } from '../createEntityStore';
import type { EntityStore } from '../createEntityStore';

/**
 * Zustand store for managing User entities
 *
 * Provides CRUD operations. Users are leaf entities with no children to cascade delete.
 */
const baseStore = createEntityStore<User, CreateUserDto>(
  userApi,
  'User'
);

// Create a new store that wraps the base store and adds convenience methods
export const useUserStore = create<EntityStore<User, CreateUserDto> & {
  fetchUsers: (teamId: string) => Promise<void>;
  fetchUser: (id: string) => Promise<User | null>;
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
  delete: (...args) => baseStore.getState().delete(...args),
  setEntities: (...args) => baseStore.getState().setEntities(...args),
  reset: () => baseStore.getState().reset(),

  // Convenience method aliases
  fetchUsers: (...args) => baseStore.getState().fetchAll(...args),
  fetchUser: (...args) => baseStore.getState().fetchById(...args),
}));

// Subscribe to base store changes to keep our wrapper in sync
baseStore.subscribe((state) => {
  useUserStore.setState({
    entities: state.entities,
    loading: state.loading,
    error: state.error,
  } as Partial<ReturnType<typeof useUserStore.getState>>);
});

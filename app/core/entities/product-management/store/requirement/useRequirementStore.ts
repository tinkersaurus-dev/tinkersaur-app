import { create } from 'zustand';
import { requirementApi } from '../../api';
import type { Requirement, CreateRequirementDto } from '../../types';
import { createEntityStore } from '../createEntityStore';
import type { EntityStore } from '../createEntityStore';

/**
 * Zustand store for managing Requirement entities
 *
 * Provides CRUD operations and relationship queries.
 * Requirements are the leaf nodes in the entity hierarchy and have no child entities.
 */
const baseStore = createEntityStore<Requirement, CreateRequirementDto>(
  requirementApi,
  'Requirement'
);

// Create a new store that wraps the base store and adds convenience methods
export const useRequirementStore = create<EntityStore<Requirement, CreateRequirementDto> & {
  getRequirementsByChangeId: (changeId: string) => Requirement[];
  fetchRequirementsByChange: (changeId: string) => Promise<void>;
  createRequirement: (data: CreateRequirementDto) => Promise<Requirement | null>;
  updateRequirement: (id: string, updates: Partial<Requirement>) => Promise<Requirement | null>;
  deleteRequirement: (id: string) => Promise<boolean>;
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
  fetchRequirementsByChange: (...args) => baseStore.getState().fetchAll(...args),
  createRequirement: (...args) => baseStore.getState().create(...args),
  updateRequirement: (...args) => baseStore.getState().update(...args),
  deleteRequirement: (...args) => baseStore.getState().delete(...args),

  // Relationship query method
  getRequirementsByChangeId: (changeId: string): Requirement[] => {
    return baseStore.getState().entities.filter(r => r.changeId === changeId);
  },
}));

// Subscribe to base store changes to keep our wrapper in sync
baseStore.subscribe((state) => {
  useRequirementStore.setState({
    entities: state.entities,
    loading: state.loading,
    error: state.error,
  } as Partial<ReturnType<typeof useRequirementStore.getState>>);
});

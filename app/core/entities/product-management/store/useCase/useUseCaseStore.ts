import { useCaseApi } from '../../api';
import type { UseCase, CreateUseCaseDto } from '../../types';
import { createStoreWrapper } from '../createStoreWrapper';

/**
 * Zustand store for managing UseCase entities
 *
 * Provides CRUD operations and relationship queries.
 * When a use case is deleted, all associated requirements are also deleted.
 */
export const useUseCaseStore = createStoreWrapper<UseCase, CreateUseCaseDto, {
  getUseCasesBySolutionId: (solutionId: string) => UseCase[];
  fetchUseCasesBySolution: (solutionId: string) => Promise<void>;
  createUseCase: (data: CreateUseCaseDto) => Promise<UseCase | null>;
  updateUseCase: (id: string, updates: Partial<UseCase>) => Promise<UseCase | null>;
  deleteUseCase: (id: string) => Promise<boolean>;
}>({
  api: useCaseApi,
  entityName: 'UseCase',

  deleteHandler: async (id, baseStore, api) => {
    // Import here to avoid circular dependency
    const { useRequirementStore } = await import('../requirement/useRequirementStore');
    const { usePersonaUseCaseStore } = await import('../personaUseCase/usePersonaUseCaseStore');

    const requirementStore = useRequirementStore.getState();
    const personaUseCaseStore = usePersonaUseCaseStore.getState();

    // Get all requirements for this use case
    const requirements = requirementStore.entities.filter(r => r.useCaseId === id);

    // Delete all requirements
    for (const requirement of requirements) {
      await requirementStore.delete(requirement.id);
    }

    // Delete all persona-usecase links for this use case
    await personaUseCaseStore.deleteByUseCaseId(id);

    // Finally, delete the use case itself
    const success = await api.delete(id);

    if (success) {
      const currentEntities = baseStore.getState().entities;
      baseStore.setState({
        entities: currentEntities.filter(u => u.id !== id),
      });
    }

    return success;
  },

  extensions: (baseStore, get) => ({
    // Relationship query method
    getUseCasesBySolutionId: (solutionId: string): UseCase[] => {
      return baseStore.getState().entities.filter(u => u.solutionId === solutionId);
    },

    // Convenience method aliases
    fetchUseCasesBySolution: (...args) => baseStore.getState().fetchAll(...args),
    createUseCase: (...args) => baseStore.getState().create(...args),
    updateUseCase: (...args) => baseStore.getState().update(...args),
    deleteUseCase: (id: string) => get().delete(id),
  }),
});

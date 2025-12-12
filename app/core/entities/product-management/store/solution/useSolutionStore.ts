import { solutionApi } from '../../api';
import type { Solution, CreateSolutionDto } from '../../types';
import { createStoreWrapper } from '../createStoreWrapper';

/**
 * Zustand store for managing Solution entities
 *
 * Provides CRUD operations and cascade delete functionality.
 * When a solution is deleted, all associated use cases and requirements are also deleted.
 */
export const useSolutionStore = createStoreWrapper<Solution, CreateSolutionDto, {
  fetchSolutions: (teamId: string) => Promise<void>;
  fetchSolution: (id: string) => Promise<Solution | null>;
}>({
  api: solutionApi,
  entityName: 'Solution',

  deleteHandler: async (id, baseStore, api) => {
    // Import stores lazily to avoid circular dependency
    const { useUseCaseStore } = await import('../useCase/useUseCaseStore');
    const { useRequirementStore } = await import('../requirement/useRequirementStore');

    const useCaseStore = useUseCaseStore.getState();
    const requirementStore = useRequirementStore.getState();

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
    const success = await api.delete(id);

    if (success) {
      const currentEntities = baseStore.getState().entities;
      baseStore.setState({
        entities: currentEntities.filter(s => s.id !== id),
      });
    }

    return success;
  },

  extensions: (baseStore) => ({
    fetchSolutions: (...args) => baseStore.getState().fetchAll(...args),
    fetchSolution: (...args) => baseStore.getState().fetchById(...args),
  }),
});

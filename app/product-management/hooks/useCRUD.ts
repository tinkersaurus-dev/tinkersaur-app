/**
 * CRUD hooks - Provides common CRUD operations for entity management
 */

import { useCallback } from 'react';
import {
  useSolutionStore,
  type CreateSolutionDto,
  type CreateUseCaseDto,
  type CreateRequirementDto,
  type Solution,
  type UseCase,
  type Requirement,
} from '~/core/entities/product-management';
import { useUseCaseStore } from '~/core/entities/product-management/store/useCase/useUseCaseStore';
import { useRequirementStore } from '~/core/entities/product-management/store/requirement/useRequirementStore';

/**
 * Solution CRUD operations
 */
export function useSolutionCRUD() {
  const createSolution = useSolutionStore((state) => state.create);
  const updateSolution = useSolutionStore((state) => state.update);
  const deleteSolution = useSolutionStore((state) => state.delete);

  const handleCreate = useCallback(
    async (data: CreateSolutionDto) => {
      const solution = await createSolution(data);
      return solution;
    },
    [createSolution]
  );

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<Solution>) => {
      await updateSolution(id, updates);
    },
    [updateSolution]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteSolution(id);
    },
    [deleteSolution]
  );

  return { handleCreate, handleUpdate, handleDelete };
}

/**
 * UseCase CRUD operations
 */
export function useUseCaseCRUD() {
  const createUseCase = useUseCaseStore((state) => state.createUseCase);
  const updateUseCase = useUseCaseStore((state) => state.updateUseCase);
  const deleteUseCase = useUseCaseStore((state) => state.deleteUseCase);

  const handleCreate = useCallback(
    async (data: CreateUseCaseDto) => {
      const useCase = await createUseCase(data);
      return useCase;
    },
    [createUseCase]
  );

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<UseCase>) => {
      await updateUseCase(id, updates);
    },
    [updateUseCase]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteUseCase(id);
    },
    [deleteUseCase]
  );

  return { handleCreate, handleUpdate, handleDelete };
}

/**
 * Requirement CRUD operations
 */
export function useRequirementCRUD() {
  const createRequirement = useRequirementStore((state) => state.createRequirement);
  const updateRequirement = useRequirementStore((state) => state.updateRequirement);
  const deleteRequirement = useRequirementStore((state) => state.deleteRequirement);

  const handleCreate = useCallback(
    async (data: CreateRequirementDto) => {
      const requirement = await createRequirement(data);
      return requirement;
    },
    [createRequirement]
  );

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<Requirement>) => {
      await updateRequirement(id, updates);
    },
    [updateRequirement]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteRequirement(id);
    },
    [deleteRequirement]
  );

  return { handleCreate, handleUpdate, handleDelete };
}

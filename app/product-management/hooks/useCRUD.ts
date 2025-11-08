/**
 * CRUD hooks - Provides common CRUD operations for entity management
 */

import { useCallback } from 'react';
import {
  useSolutionManagementEntityStore,
  type CreateSolutionDto,
  type CreateFeatureDto,
  type CreateChangeDto,
  type CreateRequirementDto,
  type Solution,
  type Feature,
  type Change,
  type Requirement,
} from '~/core/entities/product-management';

/**
 * Solution CRUD operations
 */
export function useSolutionCRUD() {
  const createSolution = useSolutionManagementEntityStore((state) => state.createSolution);
  const updateSolution = useSolutionManagementEntityStore((state) => state.updateSolution);
  const deleteSolution = useSolutionManagementEntityStore((state) => state.deleteSolution);

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
 * Feature CRUD operations
 */
export function useFeatureCRUD() {
  const createFeature = useSolutionManagementEntityStore((state) => state.createFeature);
  const updateFeature = useSolutionManagementEntityStore((state) => state.updateFeature);
  const deleteFeature = useSolutionManagementEntityStore((state) => state.deleteFeature);

  const handleCreate = useCallback(
    async (data: CreateFeatureDto) => {
      const feature = await createFeature(data);
      return feature;
    },
    [createFeature]
  );

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<Feature>) => {
      await updateFeature(id, updates);
    },
    [updateFeature]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteFeature(id);
    },
    [deleteFeature]
  );

  return { handleCreate, handleUpdate, handleDelete };
}

/**
 * Change CRUD operations
 */
export function useChangeCRUD() {
  const createChange = useSolutionManagementEntityStore((state) => state.createChange);
  const updateChange = useSolutionManagementEntityStore((state) => state.updateChange);
  const deleteChange = useSolutionManagementEntityStore((state) => state.deleteChange);

  const handleCreate = useCallback(
    async (data: CreateChangeDto) => {
      const change = await createChange(data);
      return change;
    },
    [createChange]
  );

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<Change>) => {
      await updateChange(id, updates);
    },
    [updateChange]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteChange(id);
    },
    [deleteChange]
  );

  return { handleCreate, handleUpdate, handleDelete };
}

/**
 * Requirement CRUD operations
 */
export function useRequirementCRUD() {
  const createRequirement = useSolutionManagementEntityStore((state) => state.createRequirement);
  const updateRequirement = useSolutionManagementEntityStore((state) => state.updateRequirement);
  const deleteRequirement = useSolutionManagementEntityStore((state) => state.deleteRequirement);

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

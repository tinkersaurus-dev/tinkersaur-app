/**
 * CRUD hooks - Combines entity store with UI store for common CRUD operations
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
import { useSolutionManagementUIStore } from '../store/solutionManagementUIStore';

/**
 * Solution CRUD operations
 */
export function useSolutionCRUD() {
  const createSolution = useSolutionManagementEntityStore((state) => state.createSolution);
  const updateSolution = useSolutionManagementEntityStore((state) => state.updateSolution);
  const deleteSolution = useSolutionManagementEntityStore((state) => state.deleteSolution);

  const closeModal = useSolutionManagementUIStore((state) => state.closeModal);
  const setEditingSolution = useSolutionManagementUIStore((state) => state.setEditingSolution);

  const handleCreate = useCallback(
    async (data: CreateSolutionDto) => {
      const solution = await createSolution(data);
      closeModal('addSolution');
      return solution;
    },
    [createSolution, closeModal]
  );

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<Solution>) => {
      await updateSolution(id, updates);
      closeModal('editSolution');
      setEditingSolution(null);
    },
    [updateSolution, closeModal, setEditingSolution]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteSolution(id);
      closeModal('deleteSolution');
    },
    [deleteSolution, closeModal]
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

  const closeModal = useSolutionManagementUIStore((state) => state.closeModal);
  const setEditingFeature = useSolutionManagementUIStore((state) => state.setEditingFeature);

  const handleCreate = useCallback(
    async (data: CreateFeatureDto) => {
      const feature = await createFeature(data);
      closeModal('addFeature');
      return feature;
    },
    [createFeature, closeModal]
  );

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<Feature>) => {
      await updateFeature(id, updates);
      closeModal('editFeature');
      setEditingFeature(null);
    },
    [updateFeature, closeModal, setEditingFeature]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteFeature(id);
      closeModal('deleteFeature');
    },
    [deleteFeature, closeModal]
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

  const closeModal = useSolutionManagementUIStore((state) => state.closeModal);
  const setEditingChange = useSolutionManagementUIStore((state) => state.setEditingChange);

  const handleCreate = useCallback(
    async (data: CreateChangeDto) => {
      const change = await createChange(data);
      closeModal('addChange');
      return change;
    },
    [createChange, closeModal]
  );

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<Change>) => {
      await updateChange(id, updates);
      closeModal('editChange');
      setEditingChange(null);
    },
    [updateChange, closeModal, setEditingChange]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteChange(id);
      closeModal('deleteChange');
    },
    [deleteChange, closeModal]
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

  const closeModal = useSolutionManagementUIStore((state) => state.closeModal);
  const setEditingRequirement = useSolutionManagementUIStore(
    (state) => state.setEditingRequirement
  );

  const handleCreate = useCallback(
    async (data: CreateRequirementDto) => {
      const requirement = await createRequirement(data);
      closeModal('addRequirement');
      return requirement;
    },
    [createRequirement, closeModal]
  );

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<Requirement>) => {
      await updateRequirement(id, updates);
      closeModal('editRequirement');
      setEditingRequirement(null);
    },
    [updateRequirement, closeModal, setEditingRequirement]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteRequirement(id);
      closeModal('deleteRequirement');
    },
    [deleteRequirement, closeModal]
  );

  return { handleCreate, handleUpdate, handleDelete };
}

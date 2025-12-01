/**
 * CRUD hooks - Provides common CRUD operations for entity management
 */

import { useCallback } from 'react';
import {
  useOrganizationStore,
  useTeamStore,
  useUserStore,
  useSolutionStore,
  usePersonaStore,
  type CreateOrganizationDto,
  type CreateTeamDto,
  type CreateUserDto,
  type CreateSolutionDto,
  type CreateUseCaseDto,
  type CreateRequirementDto,
  type CreatePersonaDto,
  type Organization,
  type Team,
  type User,
  type Solution,
  type UseCase,
  type Requirement,
  type Persona,
} from '~/core/entities/product-management';
import { useUseCaseStore } from '~/core/entities/product-management/store/useCase/useUseCaseStore';
import { useRequirementStore } from '~/core/entities/product-management/store/requirement/useRequirementStore';

/**
 * Organization CRUD operations
 */
export function useOrganizationCRUD() {
  const createOrganization = useOrganizationStore((state) => state.create);
  const updateOrganization = useOrganizationStore((state) => state.update);
  const deleteOrganization = useOrganizationStore((state) => state.delete);

  const handleCreate = useCallback(
    async (data: CreateOrganizationDto) => {
      const organization = await createOrganization(data);
      return organization;
    },
    [createOrganization]
  );

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<Organization>) => {
      await updateOrganization(id, updates);
    },
    [updateOrganization]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteOrganization(id);
    },
    [deleteOrganization]
  );

  return { handleCreate, handleUpdate, handleDelete };
}

/**
 * Team CRUD operations
 */
export function useTeamCRUD() {
  const createTeam = useTeamStore((state) => state.create);
  const updateTeam = useTeamStore((state) => state.update);
  const deleteTeam = useTeamStore((state) => state.delete);

  const handleCreate = useCallback(
    async (data: CreateTeamDto) => {
      const team = await createTeam(data);
      return team;
    },
    [createTeam]
  );

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<Team>) => {
      await updateTeam(id, updates);
    },
    [updateTeam]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteTeam(id);
    },
    [deleteTeam]
  );

  return { handleCreate, handleUpdate, handleDelete };
}

/**
 * User CRUD operations
 */
export function useUserCRUD() {
  const createUser = useUserStore((state) => state.create);
  const updateUser = useUserStore((state) => state.update);
  const deleteUser = useUserStore((state) => state.delete);

  const handleCreate = useCallback(
    async (data: CreateUserDto) => {
      const user = await createUser(data);
      return user;
    },
    [createUser]
  );

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<User>) => {
      await updateUser(id, updates);
    },
    [updateUser]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteUser(id);
    },
    [deleteUser]
  );

  return { handleCreate, handleUpdate, handleDelete };
}

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

/**
 * Persona CRUD operations
 */
export function usePersonaCRUD() {
  const createPersona = usePersonaStore((state) => state.create);
  const updatePersona = usePersonaStore((state) => state.update);
  const deletePersona = usePersonaStore((state) => state.delete);

  const handleCreate = useCallback(
    async (data: CreatePersonaDto) => {
      const persona = await createPersona(data);
      return persona;
    },
    [createPersona]
  );

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<Persona>) => {
      await updatePersona(id, updates);
    },
    [updatePersona]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deletePersona(id);
    },
    [deletePersona]
  );

  return { handleCreate, handleUpdate, handleDelete };
}

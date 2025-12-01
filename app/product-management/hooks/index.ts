/**
 * Solution Management Hooks
 * Custom hooks for data access and CRUD operations
 */

// Data access hooks
export { useOrganizations, useOrganization } from './useOrganizations';
export { useTeams, useTeam } from './useTeams';
export { useUsers, useUser } from './useUsers';
export { useSolutions, useSolution } from './useSolutions';
export { useUseCases, useUseCase } from './useUseCases';
export { useRequirements, useRequirement } from './useRequirements';
export { usePersonas, usePersona } from './usePersonas';
export { usePersonaUseCases, useUseCasePersonas } from './usePersonaUseCases';

// CRUD hooks
export {
  useOrganizationCRUD,
  useTeamCRUD,
  useUserCRUD,
  useSolutionCRUD,
  useUseCaseCRUD,
  useRequirementCRUD,
  usePersonaCRUD,
} from './useCRUD';

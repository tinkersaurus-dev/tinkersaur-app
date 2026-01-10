/**
 * Product Management Mutation Hooks
 * TanStack Query hooks for creating, updating, and deleting data
 */

export {
  useCreateSolution,
  useUpdateSolution,
  useDeleteSolution,
} from './useSolutionMutations';

export {
  useCreatePersona,
  useUpdatePersona,
  useDeletePersona,
  useMergePersonas,
} from './usePersonaMutations';

export {
  useCreateUseCase,
  useUpdateUseCase,
  useDeleteUseCase,
  useMergeUseCases,
} from './useUseCaseMutations';

export {
  useCreateRequirement,
  useUpdateRequirement,
  useDeleteRequirement,
} from './useRequirementMutations';

export {
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
} from './useOrganizationMutations';

export {
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
} from './useTeamMutations';

export {
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from './useUserMutations';

export {
  useCreatePersonaUseCase,
  useDeletePersonaUseCase,
} from './usePersonaUseCaseMutations';

export { useUpdateSolutionOverview } from './useSolutionOverviewMutations';

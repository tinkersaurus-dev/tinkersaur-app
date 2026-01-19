/**
 * Product Management Query Hooks
 * TanStack Query hooks for fetching data
 */

export {
  useSolutionsQuery,
  useSolutionQuery,
  prefetchSolutions,
  prefetchSolution,
} from './useSolutionsQuery';

export {
  usePersonasQuery,
  usePersonaQuery,
  prefetchPersonas,
  prefetchPersona,
} from './usePersonasQuery';

export { usePersonasPaginatedQuery } from './usePersonasPaginatedQuery';

export { useSimilarPersonasQuery } from './useSimilarPersonasQuery';

export {
  useUseCasesByTeamQuery,
  useUseCasesBySolutionQuery,
  useUseCasesQuery,
  useUseCaseQuery,
  prefetchUseCasesByTeam,
  prefetchUseCasesBySolution,
  prefetchUseCases,
  prefetchUseCase,
} from './useUseCasesQuery';

export { useUseCasesPaginatedQuery } from './useUseCasesPaginatedQuery';

export {
  useRequirementsQuery,
  useRequirementQuery,
  prefetchRequirements,
  prefetchRequirement,
} from './useRequirementsQuery';

export {
  useOrganizationsQuery,
  useOrganizationQuery,
  prefetchOrganizations,
  prefetchOrganization,
} from './useOrganizationsQuery';

export {
  useTeamsQuery,
  useTeamQuery,
  prefetchTeams,
  prefetchTeam,
} from './useTeamsQuery';

export {
  useUsersQuery,
  useUserQuery,
  prefetchUsers,
  prefetchUser,
} from './useUsersQuery';

export {
  useSolutionFactorsQuery,
  useSolutionFactorsByTypeQuery,
  prefetchSolutionFactors,
} from './useSolutionFactorsQuery';

export {
  useUseCaseDetailsQuery,
  usePersonaDetailsQuery,
  useCombinedQueryState,
} from './useBatchQueries';

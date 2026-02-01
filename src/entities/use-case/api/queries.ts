/**
 * Re-export TanStack Query hooks for UseCase entity
 * These hooks are defined in the app layer but re-exported here for convenience
 */

export {
  useUseCasesByTeamQuery,
  useUseCasesBySolutionQuery,
  useUseCasesQuery,
  useUseCaseQuery,
  prefetchUseCasesByTeam,
  prefetchUseCasesBySolution,
  prefetchUseCases,
  prefetchUseCase,
} from '~/product-management/queries';

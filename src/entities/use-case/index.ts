/**
 * Use Case Entity
 * @module entities/use-case
 */

export {
  UseCaseSchema,
  CreateUseCaseSchema,
  UpdateUseCaseSchema,
} from './model/types';

export type {
  UseCase,
  CreateUseCaseDto,
  UpdateUseCaseDto,
} from './model/types';

export { useCaseApi } from './api/useCaseApi';

export {
  useUseCasesByTeamQuery,
  useUseCasesBySolutionQuery,
  useUseCaseQuery,
  prefetchUseCasesByTeam,
  prefetchUseCasesBySolution,
  prefetchUseCase,
  useUseCasesPaginatedQuery,
  useUseCaseDetailsQuery,
} from './api/queries';

export {
  useCreateUseCase,
  useUpdateUseCase,
  useDeleteUseCase,
  useAssignUseCaseToSolution,
} from './api/mutations';

// UI Components
export { UseCaseFeedbackTab } from './ui/use-case-detail/UseCaseFeedbackTab';
export { UseCaseBasicInfo } from './ui/use-case-detail/UseCaseBasicInfo';
export { UseCaseSupportingQuotes } from './ui/use-case-detail/UseCaseSupportingQuotes';
export { AddRequirementModal } from './ui/use-case-detail/AddRequirementModal';
export { UseCasePersonasSidebar } from './ui/use-case-detail/UseCasePersonasSidebar';
export { UseCaseVersionsTab } from './ui/use-case-detail/UseCaseVersionsTab';
export { useUseCaseFeedback } from './ui/use-case-detail/useUseCaseFeedback';
export { useSourceDisplayName } from './ui/use-case-detail/useSourceDisplayName';
export * from './ui/use-case-detail/types';
export { useUseCaseContent } from './lib/useUseCaseContent';

export { UseCaseCard } from './ui/UseCaseCard';

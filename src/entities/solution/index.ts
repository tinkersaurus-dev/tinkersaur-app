/**
 * Solution Entity
 * @module entities/solution
 */

export {
  SolutionTypeSchema,
  SolutionSchema,
  CreateSolutionSchema,
  UpdateSolutionSchema,
} from './model/types';

export type {
  SolutionType,
  Solution,
  CreateSolutionDto,
  UpdateSolutionDto,
} from './model/types';

export { solutionApi } from './api/solutionApi';

export {
  useSolutionsQuery,
  useSolutionQuery,
  prefetchSolutions,
  prefetchSolution,
} from './api/queries';

export {
  useCreateSolution,
  useUpdateSolution,
  useDeleteSolution,
} from './api/mutations';

export { SolutionCard } from './ui/SolutionCard';

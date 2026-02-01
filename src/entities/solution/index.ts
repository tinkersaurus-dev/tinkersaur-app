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

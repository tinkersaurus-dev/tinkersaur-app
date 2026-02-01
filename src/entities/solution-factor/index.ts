/**
 * Solution Factor Entity
 * @module entities/solution-factor
 */

export {
  SolutionFactorTypeSchema,
  SolutionFactorSchema,
  CreateSolutionFactorSchema,
  UpdateSolutionFactorSchema,
  CreateSolutionFactorsBulkSchema,
  ReorderSolutionFactorsSchema,
  FACTOR_TYPE_LABELS,
  groupFactorsByType,
} from './model/types';

export type {
  SolutionFactorType,
  SolutionFactor,
  CreateSolutionFactorDto,
  UpdateSolutionFactorDto,
  CreateSolutionFactorsBulkDto,
  ReorderSolutionFactorsDto,
} from './model/types';

export { solutionFactorApi } from './api/solutionFactorApi';

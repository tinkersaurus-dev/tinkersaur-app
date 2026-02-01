/**
 * Use Case Entity
 * @module entities/use-case
 */

export {
  UseCaseSchema,
  CreateUseCaseSchema,
  UpdateUseCaseSchema,
  MergedUseCaseDataSchema,
  MergeUseCasesRequestSchema,
} from './model/types';

export type {
  UseCase,
  CreateUseCaseDto,
  UpdateUseCaseDto,
  FindSimilarUseCasesRequest,
  SimilarUseCaseResult,
  MergedUseCaseData,
  MergeUseCasesRequest,
} from './model/types';

export { useCaseApi } from './api/useCaseApi';

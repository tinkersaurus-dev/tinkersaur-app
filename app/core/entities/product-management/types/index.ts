/**
 * Solution Management Entity Types
 * Centralized export for all solution management domain types and schemas
 */


// Solution
export type { Solution, SolutionType, CreateSolutionDto, UpdateSolutionDto } from './Solution';
export { SolutionSchema, SolutionTypeSchema, CreateSolutionSchema, UpdateSolutionSchema } from './Solution';

// UseCase
export type { UseCase, CreateUseCaseDto, UpdateUseCaseDto } from './UseCase';
export { UseCaseSchema, CreateUseCaseSchema, UpdateUseCaseSchema } from './UseCase';

// Requirement
export type { Requirement, RequirementType, CreateRequirementDto, UpdateRequirementDto } from './Requirement';
export {
  RequirementSchema,
  RequirementTypeSchema,
  CreateRequirementSchema,
  UpdateRequirementSchema,
} from './Requirement';

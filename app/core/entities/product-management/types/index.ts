/**
 * Solution Management Entity Types
 * Centralized export for all solution management domain types and schemas
 */


// Solution
export type { Solution, SolutionType, CreateSolutionDto, UpdateSolutionDto } from './Solution';
export { SolutionSchema, SolutionTypeSchema, CreateSolutionSchema, UpdateSolutionSchema } from './Solution';

// Feature
export type { Feature, CreateFeatureDto, UpdateFeatureDto } from './Feature';
export { FeatureSchema, CreateFeatureSchema, UpdateFeatureSchema } from './Feature';

// Change
export type { Change, ChangeStatus, CreateChangeDto, UpdateChangeDto } from './Change';
export { ChangeSchema, ChangeStatusSchema, CreateChangeSchema, UpdateChangeSchema } from './Change';

// Requirement
export type { Requirement, RequirementType, CreateRequirementDto, UpdateRequirementDto } from './Requirement';
export {
  RequirementSchema,
  RequirementTypeSchema,
  CreateRequirementSchema,
  UpdateRequirementSchema,
} from './Requirement';

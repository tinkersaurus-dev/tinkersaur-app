/**
 * Requirement Entity
 * @module entities/requirement
 */

export {
  RequirementTypeSchema,
  RequirementStatusSchema,
  RequirementSchema,
  CreateRequirementSchema,
  UpdateRequirementSchema,
  REQUIREMENT_TYPE_CONFIG,
  REQUIREMENT_STATUS_CONFIG,
} from './model/types';

export type {
  RequirementType,
  RequirementStatus,
  Requirement,
  CreateRequirementDto,
  UpdateRequirementDto,
} from './model/types';

export { requirementApi } from './api/requirementApi';

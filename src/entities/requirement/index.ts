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
  ExtractedRequirement,
} from './model/types';

export { requirementApi } from './api/requirementApi';

export {
  useRequirementsQuery,
  useRequirementQuery,
  prefetchRequirements,
  prefetchRequirement,
  useRequirementsBySolutionQuery,
} from './api/queries';

export type { RequirementWithUseCase } from './api/queries';

export {
  useCreateRequirement,
  useUpdateRequirement,
  useDeleteRequirement,
} from './api/mutations';

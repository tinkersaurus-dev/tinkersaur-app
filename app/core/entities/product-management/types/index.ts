/**
 * Solution Management Entity Types
 * Centralized export for all solution management domain types and schemas
 */

// Organization
export type { Organization, CreateOrganizationDto, UpdateOrganizationDto } from './Organization';
export { OrganizationSchema, CreateOrganizationSchema, UpdateOrganizationSchema } from './Organization';

// Team
export type { Team, CreateTeamDto, UpdateTeamDto } from './Team';
export { TeamSchema, CreateTeamSchema, UpdateTeamSchema } from './Team';

// User
export type { User, CreateUserDto, UpdateUserDto } from './User';
export { UserSchema, CreateUserSchema, UpdateUserSchema } from './User';

// Solution
export type { Solution, SolutionType, CreateSolutionDto, UpdateSolutionDto } from './Solution';
export { SolutionSchema, SolutionTypeSchema, CreateSolutionSchema, UpdateSolutionSchema } from './Solution';

// UseCase
export type {
  UseCase,
  CreateUseCaseDto,
  UpdateUseCaseDto,
  FindSimilarUseCasesRequest,
  SimilarUseCaseResult,
  MergedUseCaseData,
  MergeUseCasesRequest,
} from './UseCase';
export {
  UseCaseSchema,
  CreateUseCaseSchema,
  UpdateUseCaseSchema,
  MergedUseCaseDataSchema,
  MergeUseCasesRequestSchema,
} from './UseCase';

// Requirement
export type { Requirement, RequirementType, RequirementStatus, CreateRequirementDto, UpdateRequirementDto } from './Requirement';
export {
  RequirementSchema,
  RequirementTypeSchema,
  RequirementStatusSchema,
  CreateRequirementSchema,
  UpdateRequirementSchema,
  REQUIREMENT_TYPE_CONFIG,
  REQUIREMENT_STATUS_CONFIG,
} from './Requirement';

// Persona
export type {
  Persona,
  Demographics,
  CreatePersonaDto,
  UpdatePersonaDto,
  FindSimilarPersonasRequest,
  SimilarPersonaResult,
  MergedPersonaData,
  MergePersonasRequest,
} from './Persona';
export {
  PersonaSchema,
  DemographicsSchema,
  CreatePersonaSchema,
  UpdatePersonaSchema,
  FindSimilarPersonasRequestSchema,
  SimilarPersonaResultSchema,
  MergedPersonaDataSchema,
  MergePersonasRequestSchema,
} from './Persona';

// PersonaUseCase (junction)
export type { PersonaUseCase, CreatePersonaUseCaseDto } from './PersonaUseCase';
export { PersonaUseCaseSchema, CreatePersonaUseCaseSchema } from './PersonaUseCase';

// SolutionFactor
export type {
  SolutionFactor,
  SolutionFactorType,
  CreateSolutionFactorDto,
  UpdateSolutionFactorDto,
  CreateSolutionFactorsBulkDto,
  ReorderSolutionFactorsDto,
} from './SolutionFactor';
export {
  SolutionFactorSchema,
  SolutionFactorTypeSchema,
  CreateSolutionFactorSchema,
  UpdateSolutionFactorSchema,
  CreateSolutionFactorsBulkSchema,
  ReorderSolutionFactorsSchema,
  FACTOR_TYPE_LABELS,
  groupFactorsByType,
} from './SolutionFactor';

// UseCaseVersion
export type {
  UseCaseVersion,
  UseCaseVersionDetail,
  UseCaseSnapshot,
  RequirementSnapshot,
  DesignWorkSnapshot,
  DiagramSnapshot,
  DocumentSnapshot,
  InterfaceSnapshot,
  ReferenceSnapshot,
  CreateUseCaseVersionDto,
  UpdateUseCaseVersionDto,
  TransitionVersionStatusDto,
  VersionDiff,
  VersionComparison,
} from './UseCaseVersion';
export {
  UseCaseVersionStatus,
  UseCaseVersionSchema,
  UseCaseVersionDetailSchema,
  UseCaseSnapshotSchema,
  CreateUseCaseVersionSchema,
  UpdateUseCaseVersionSchema,
  TransitionVersionStatusSchema,
  VersionDiffSchema,
  VersionComparisonSchema,
  getStatusColor,
  getValidTransitions,
  formatVersionNumber,
  formatVersionDisplay,
} from './UseCaseVersion';

/**
 * Use Case Version Entity
 * @module entities/use-case-version
 */

export { UseCaseVersionStatus } from './model/types';

export {
  RequirementSnapshotSchema,
  DiagramSnapshotSchema,
  DocumentSnapshotSchema,
  InterfaceSnapshotSchema,
  ReferenceSnapshotSchema,
  DesignWorkSnapshotSchema,
  UseCaseSnapshotSchema,
  UseCaseVersionSchema,
  UseCaseVersionDetailSchema,
  CreateUseCaseVersionSchema,
  UpdateUseCaseVersionSchema,
  TransitionVersionStatusSchema,
  VersionDiffSchema,
  VersionComparisonSchema,
} from './model/types';

export type {
  RequirementSnapshot,
  DiagramSnapshot,
  DocumentSnapshot,
  InterfaceSnapshot,
  ReferenceSnapshot,
  DesignWorkSnapshot,
  UseCaseSnapshot,
  UseCaseVersion,
  UseCaseVersionDetail,
  CreateUseCaseVersionDto,
  UpdateUseCaseVersionDto,
  TransitionVersionStatusDto,
  VersionDiff,
  VersionComparison,
} from './model/types';

export {
  getStatusColor,
  getValidTransitions,
  formatVersionNumber,
  formatVersionDisplay,
  getLatestVersionByStatus,
} from './model/types';

export { useCaseVersionApi } from './api/useCaseVersionApi';

export {
  useCreateUseCaseVersion,
  useUpdateUseCaseVersion,
  useDeleteUseCaseVersion,
  useTransitionUseCaseVersionStatus,
  useRevertToUseCaseVersion,
} from './api/mutations';

// Store
export { useUseCaseVersionStore } from './store/useUseCaseVersionStore';

// UI Components
export { SpecificationDiffView } from './ui/SpecificationDiffView';
export { UseCaseVersionDetailPanel } from './ui/UseCaseVersionDetailPanel';
export { UseCaseVersionsTable } from './ui/UseCaseVersionsTable';

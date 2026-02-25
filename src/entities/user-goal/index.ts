/**
 * User Goal Entity
 * @module entities/user-goal
 */

export {
  UserGoalSchema,
  CreateUserGoalSchema,
  UpdateUserGoalSchema,
  MergedUserGoalDataSchema,
  MergeUserGoalsRequestSchema,
} from './model/types';

export type {
  UserGoal,
  CreateUserGoalDto,
  UpdateUserGoalDto,
  FindSimilarUserGoalsRequest,
  SimilarUserGoalResult,
  MergedUserGoalData,
  MergeUserGoalsRequest,
  PromoteUserGoalRequest,
} from './model/types';

export { userGoalApi } from './api/userGoalApi';

export {
  useUserGoalsByTeamQuery,
  useUserGoalQuery,
  prefetchUserGoalsByTeam,
  prefetchUserGoal,
  useUserGoalsPaginatedQuery,
  useUserGoalDetailsQuery,
} from './api/queries';

export {
  useCreateUserGoal,
  useUpdateUserGoal,
  useDeleteUserGoal,
  usePromoteUserGoal,
} from './api/mutations';

export {
  mergeUserGoals,
  MergeUserGoalsAPIError,
  type UserGoalInput,
  type MergeUserGoalsResponse,
} from './api/merge-user-goals-api';

// Filters
export {
  WEAK_EVIDENCE_THRESHOLD,
  STRONG_EVIDENCE_THRESHOLD,
  getEvidenceCount,
  getEvidenceStrength,
  hasWeakEvidence,
  filterWeakEvidenceUserGoals,
  getDaysSinceLastIntake,
  getFreshness,
} from './lib/filters';
export type { EvidenceStrength, Freshness } from './lib/filters';

// Evidence utilities
export { countFeedbackByType } from './lib/evidence';
export type { FeedbackTypeCounts } from './lib/evidence';

// UI Components
export { UserGoalCard } from './ui/UserGoalCard';
export { UserGoalBasicInfo } from './ui/UserGoalBasicInfo';
export { UserGoalPersonasSidebar } from './ui/UserGoalPersonasSidebar';
export { useUserGoalFeedback } from './ui/useUserGoalFeedback';
export type { FeedbackRow, UserGoalFeedbackResult } from './ui/useUserGoalFeedback';

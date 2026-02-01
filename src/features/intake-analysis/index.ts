/**
 * Intake Analysis Feature
 *
 * This feature handles the intake analysis workflow, including:
 * - Parsing transcripts to extract personas, use cases, feedback, and outcomes
 * - Finding similar existing entities
 * - Saving intake results with merge support
 *
 * @module features/intake-analysis
 */

// API - Query and mutation hooks
export {
  createBatchSimilarityQueryHook,
  useFeedbacksPaginatedQuery,
  useFeedbackQuery,
  useFeedbackWithChildrenQuery,
  useIntakeSourceQuery,
  useOutcomeQuery,
  useOutcomesPaginatedQuery,
  useSimilarPersonasQuery,
  useSimilarUseCasesQuery,
  useSimilarFeedbackQuery,
  useSimilarOutcomesQuery,
  useIntakeSourceDetailsQuery,
  useDeleteOutcome,
  useUpdateOutcome,
  useDeleteFeedback,
  useUpdateFeedback,
} from './api';

// Lib - Hooks and types
export {
  useParseTranscript,
  useSaveIntakeResult,
  useFeedbacksQuery,
  useOutcomesQuery,
} from './lib/hooks';

export type {
  PendingMerge,
  PendingUseCaseMerge,
  PendingFeedbackMerge,
} from './lib/hooks';

export type {
  SimilarPersonaInfo,
  SimilarUseCaseInfo,
  SimilarFeedbackInfo,
  SimilarOutcomeInfo,
} from './lib/types';

// Model - Constants
export {
  FEEDBACK_ICONS,
  FEEDBACK_ICON_COLORS,
  FEEDBACK_TAG_COLORS,
} from './model/constants';

// UI - Components
export {
  QuoteHighlight,
  QuotesList,
  SimilarityComparisonDrawer,
  PersonaResultCard,
  UseCaseResultCard,
  FeedbackResultCard,
  IntakeResults,
  FeedbackChildrenExpander,
  DashboardListSection,
  PersonaRow,
  UseCaseRow,
  FeedbackRow,
  OutcomeRow,
  PersonaIcon,
  UseCaseIcon,
  FeedbackIcon,
  OutcomeIcon,
} from './ui';

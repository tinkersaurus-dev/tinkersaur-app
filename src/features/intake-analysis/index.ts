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
export { createBatchSimilarityQueryHook } from './api/createBatchSimilarityQueryHook';
export {
  useSimilarPersonasQuery,
  useSimilarUseCasesQuery,
  useSimilarFeedbackQuery,
  useSimilarOutcomesQuery,
} from './api/useSimilarityQueries';
export { useFeedbacksPaginatedQuery } from './api/useFeedbacksPaginatedQuery';
export { useFeedbackQuery } from './api/useFeedbackQuery';
export { useFeedbackWithChildrenQuery } from './api/useFeedbackWithChildrenQuery';
export { useIntakeSourceQuery } from './api/useIntakeSourceQuery';
export { useOutcomeQuery } from './api/useOutcomeQuery';
export { useOutcomesPaginatedQuery } from './api/useOutcomesPaginatedQuery';
export { useIntakeSourceDetailsQuery } from './api/useBatchQueries';
export {
  useDeleteOutcome,
  useUpdateOutcome,
  useDeleteFeedback,
  useUpdateFeedback,
} from './api/mutations';

// Lib - Hooks and types
export { useParseTranscript } from './lib/hooks/useParseTranscript';
export { useSaveIntakeResult } from './lib/hooks/useSaveIntakeResult';
export type {
  PendingMerge,
  PendingUseCaseMerge,
  PendingFeedbackMerge,
} from './lib/hooks/useSaveIntakeResult';
export { useFeedbacksQuery } from './lib/hooks/useFeedbacksQuery';
export { useOutcomesQuery } from './lib/hooks/useOutcomesQuery';

export type {
  SimilarPersonaInfo,
  SimilarUseCaseInfo,
  SimilarFeedbackInfo,
  SimilarOutcomeInfo,
} from './lib/types/similarity';

// Model - Constants
export {
  FEEDBACK_ICONS,
  FEEDBACK_ICON_COLORS,
  FEEDBACK_TAG_COLORS,
} from './model/constants/feedbackTypeConfig';

// UI - Components
export { QuoteHighlight, QuotesList } from './ui/QuoteHighlight';
export { SimilarityComparisonDrawer } from './ui/SimilarityComparisonDrawer';
export { PersonaResultCard } from './ui/PersonaResultCard';
export { UseCaseResultCard } from './ui/UseCaseResultCard';
export { FeedbackResultCard } from './ui/FeedbackResultCard';
export { OutcomeResultCard } from './ui/OutcomeResultCard';
export { IntakeResults } from './ui/IntakeResults';
export { FeedbackChildrenExpander } from './ui/FeedbackChildrenExpander';
export { DashboardListSection } from './ui/DashboardListSection';
export {
  PersonaRow,
  UseCaseRow,
  FeedbackRow,
  OutcomeRow,
  PersonaIcon,
  UseCaseIcon,
  FeedbackIcon,
  OutcomeIcon,
} from './ui/RecentEntityRow';

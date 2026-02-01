/**
 * Intake Analysis API
 * TanStack Query hooks for fetching and mutating intake analysis data
 */

export { createBatchSimilarityQueryHook } from './createBatchSimilarityQueryHook';
export { useFeedbacksPaginatedQuery } from './useFeedbacksPaginatedQuery';
export { useFeedbackQuery } from './useFeedbackQuery';
export { useFeedbackWithChildrenQuery } from './useFeedbackWithChildrenQuery';
export { useIntakeSourceQuery } from './useIntakeSourceQuery';
export { useOutcomeQuery } from './useOutcomeQuery';
export { useOutcomesPaginatedQuery } from './useOutcomesPaginatedQuery';
export {
  useSimilarPersonasQuery,
  useSimilarUseCasesQuery,
  useSimilarFeedbackQuery,
  useSimilarOutcomesQuery,
} from './useSimilarityQueries';

export { useIntakeSourceDetailsQuery } from './useBatchQueries';

// Mutations
export { useDeleteOutcome, useUpdateOutcome } from './mutations';
export { useDeleteFeedback, useUpdateFeedback } from './mutations';

/**
 * Feedback Analysis Feature
 *
 * Interactive exploration of feedback collected during intake.
 * Provides timeline visualization and filterable feedback grid.
 *
 * @module features/feedback-analysis
 */

// Lib
export { useAnalyzeFilterState } from './lib/useAnalyzeFilterState';
export { useTimelineBuckets } from './lib/useTimelineBuckets';
export type { TimelineBucket } from './lib/useTimelineBuckets';

// UI
export { FeedbackAnalysisList } from './ui/FeedbackAnalysisList';
export { FeedbackAnalysisFilters } from './ui/FeedbackAnalysisFilters';

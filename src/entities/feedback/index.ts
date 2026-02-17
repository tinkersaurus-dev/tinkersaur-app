/**
 * Feedback Entity
 * @module entities/feedback
 */

export {
  FeedbackTypeSchema,
  ExtractedFeedbackSchema,
  FeedbackSchema,
  FeedbackWithChildrenSchema,
  CreateFeedbackSchema,
  UpdateFeedbackSchema,
  FEEDBACK_TYPE_CONFIG,
  FEEDBACK_TAG_COLORS,
} from './model/types';

export type {
  FeedbackType,
  ExtractedFeedback,
  Feedback,
  FeedbackWithChildren,
  CreateFeedbackDto,
  UpdateFeedbackDto,
  FindSimilarFeedbackRequest,
  SimilarFeedbackResult,
  MergeFeedbackRequest,
  MergeFeedbackResponse,
} from './model/types';

export { feedbackApi } from './api/feedbackApi';

// Query hooks
export {
  useFeedbacksQuery,
  useFeedbackQuery,
  useFeedbackWithChildrenQuery,
  useFeedbacksPaginatedQuery,
} from './api/queries';

// Mutation hooks
export { useDeleteFeedback, useUpdateFeedback } from './api/mutations';

// Filters
export { isUnlinkedFeedback, filterUnlinkedFeedback } from './lib/filters';

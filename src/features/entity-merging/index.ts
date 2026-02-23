/**
 * Entity Merging Feature
 * @module features/entity-merging
 */

// UI Components
export { SimilarPersonasPanel } from './ui/SimilarPersonasPanel';

// Persona Merging
export { PersonaMergeModal } from './ui/persona/PersonaMergeModal';
export { IntakePersonaMergeModal, type PendingPersonaMerge } from './ui/persona/IntakePersonaMergeModal';

// Feedback Merging
export { FeedbackMergeModal } from './ui/feedback/FeedbackMergeModal';
export { IntakeFeedbackMergeModal, type PendingFeedbackMerge } from './ui/feedback/IntakeFeedbackMergeModal';

// User Goal Merging
export { UserGoalMergeModal } from './ui/user-goal/UserGoalMergeModal';
export { IntakeUserGoalMergeModal, type PendingUserGoalMerge } from './ui/user-goal/IntakeUserGoalMergeModal';

// Hooks
export { useUnmergeFeedback } from './api/hooks/useUnmergeFeedback';

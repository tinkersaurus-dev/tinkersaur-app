/**
 * Entity Merging Feature
 * @module features/entity-merging
 */

// UI Components
export { SimilarPersonasPanel } from './ui/SimilarPersonasPanel';

// Persona Merging
export { PersonaMergeModal } from './ui/persona/PersonaMergeModal';

// Feedback Merging
export { FeedbackMergeModal } from './ui/feedback/FeedbackMergeModal';

// User Goal Merging
export { UserGoalMergeModal } from './ui/user-goal/UserGoalMergeModal';

// Shared merge primitives (used by intake feature for intake-specific merge modals)
export { TwoStepMergeModal } from './ui/shared/TwoStepMergeModal';
export { MergeInstructionsField } from './ui/shared/MergeInstructionsField';
export { DeferredExecutionWarning } from './ui/shared/DeferredExecutionWarning';

// Hooks
export { useUnmergeFeedback } from './api/hooks/useUnmergeFeedback';
export { useMergePersonasLLM } from './api/hooks/useMergePersonasLLM';
export { useMergeUserGoalsLLM } from './api/hooks/useMergeUserGoalsLLM';

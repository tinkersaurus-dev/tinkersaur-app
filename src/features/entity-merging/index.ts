/**
 * Entity Merging Feature
 * @module features/entity-merging
 */

// UI Components
export { SimilarPersonasPanel } from './ui/SimilarPersonasPanel';

// Persona Merging
export { PersonaMergeModal } from './ui/persona/PersonaMergeModal';
export { IntakePersonaMergeModal, type PendingPersonaMerge } from './ui/persona/IntakePersonaMergeModal';

// Use Case Merging
export { UseCaseMergeModal } from './ui/use-case/UseCaseMergeModal';
export { IntakeUseCaseMergeModal, type PendingUseCaseMerge } from './ui/use-case/IntakeUseCaseMergeModal';

// Feedback Merging
export { FeedbackMergeModal } from './ui/feedback/FeedbackMergeModal';
export { IntakeFeedbackMergeModal, type PendingFeedbackMerge } from './ui/feedback/IntakeFeedbackMergeModal';

// Hooks
export { useUnmergeFeedback } from './api/hooks/useUnmergeFeedback';

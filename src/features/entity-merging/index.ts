/**
 * Entity Merging Feature
 * Unified feature for merging personas, use cases, and feedback
 */

// Hooks - LLM Generation
export { useMergePersonasLLM } from './api/hooks/useMergePersonasLLM';
export { useMergeUseCasesLLM } from './api/hooks/useMergeUseCasesLLM';

// Hooks - Mutations
export { useMergePersonas } from './api/hooks/useMergePersonas';
export { useMergeUseCases } from './api/hooks/useMergeUseCases';
export { useMergeFeedbacks } from './api/hooks/useMergeFeedbacks';
export { useUnmergeFeedback } from './api/hooks/useUnmergeFeedback';

// UI - Persona
export { PersonaMergeModal } from './ui/persona/PersonaMergeModal';
export { IntakePersonaMergeModal, type PendingPersonaMerge } from './ui/persona/IntakePersonaMergeModal';

// UI - Use Case
export { UseCaseMergeModal } from './ui/use-case/UseCaseMergeModal';
export { IntakeUseCaseMergeModal, type PendingUseCaseMerge } from './ui/use-case/IntakeUseCaseMergeModal';

// UI - Feedback
export { FeedbackMergeModal } from './ui/feedback/FeedbackMergeModal';
export { IntakeFeedbackMergeModal, type PendingFeedbackMerge } from './ui/feedback/IntakeFeedbackMergeModal';

// UI - Shared Components
export {
  TwoStepMergeModal,
  MergeInstructionsField,
  DeferredExecutionWarning,
  type TwoStepMergeModalProps,
} from './ui/shared/TwoStepMergeModal';

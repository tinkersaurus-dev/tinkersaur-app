/**
 * Two-Step Merge Modal Base Component
 *
 * Provides the common structure for LLM-powered merge modals:
 * - Step 1 (confirm): Show items to merge, optional instructions input
 * - Step 2 (preview): Show LLM-generated preview, confirm button
 *
 * Used by IntakePersonaMergeModal, IntakeUseCaseMergeModal, and similar modals
 * that need a two-phase confirm-then-preview workflow.
 */

import { useState, type ReactNode } from 'react';
import { FiZap } from 'react-icons/fi';
import { Modal, Button } from '@/shared/ui';

export interface TwoStepMergeModalProps<TResult> {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal is closed (cancel or after confirm) */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Optional modal width (default: 800) */
  width?: number;

  // LLM state (passed from parent hook)
  /** Whether LLM is generating the preview */
  isGenerating: boolean;
  /** Error message from LLM generation */
  generationError: string | null | undefined;
  /** The LLM-generated result (null before generation) */
  result: TResult | null;
  /** Reset the LLM hook state */
  onReset: () => void;

  // Actions
  /** Called when "Generate" button is clicked */
  onGenerate: () => void;
  /** Called when "Confirm" button is clicked on preview step */
  onConfirm: () => void;

  // Labels
  /** Label for the generate button (e.g., "Generate Merged Persona") */
  generateButtonLabel: string;
  /** Label for the confirm button (default: "Confirm Merge") */
  confirmButtonLabel?: string;

  // Validation
  /** Whether the generate button should be disabled (beyond loading state) */
  canGenerate?: boolean;

  // Content render props
  /** Render the confirm step content (items to merge, etc.) */
  renderConfirmStep: () => ReactNode;
  /** Render the preview step content (preview of merged result) */
  renderPreviewStep: (result: TResult) => ReactNode;
  /** Optional: Render instructions textarea (if not provided, no instructions field) */
  renderInstructions?: (value: string, onChange: (v: string) => void) => ReactNode;
  /** Optional: Warning message to show on preview step */
  previewWarning?: ReactNode;
}

export function TwoStepMergeModal<TResult>({
  open,
  onClose,
  title,
  width = 800,
  isGenerating,
  generationError,
  result,
  onReset,
  onGenerate,
  onConfirm,
  generateButtonLabel,
  confirmButtonLabel = 'Confirm Merge',
  canGenerate = true,
  renderConfirmStep,
  renderPreviewStep,
  renderInstructions,
  previewWarning,
}: TwoStepMergeModalProps<TResult>) {
  const [instructions, setInstructions] = useState('');

  // Derive step from whether we have a result
  const step = result ? 'preview' : 'confirm';

  const handleClose = () => {
    setInstructions('');
    onReset();
    onClose();
  };

  const handleGenerate = () => {
    onGenerate();
  };

  const handleConfirm = () => {
    setInstructions('');
    onReset();
    onConfirm();
  };

  const confirmFooter = (
    <div className="flex justify-end gap-3">
      <Button variant="default" onClick={handleClose}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleGenerate}
        disabled={isGenerating || !canGenerate}
      >
        {isGenerating ? (
          <>
            <FiZap className="animate-pulse mr-2" />
            Generating...
          </>
        ) : (
          <>
            <FiZap className="mr-2" />
            {generateButtonLabel}
          </>
        )}
      </Button>
    </div>
  );

  const previewFooter = (
    <div className="flex justify-end gap-3">
      <Button variant="default" onClick={handleClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleConfirm}>
        {confirmButtonLabel}
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title={title}
      width={width}
      footer={step === 'confirm' ? confirmFooter : previewFooter}
    >
      {step === 'confirm' && (
        <div className="space-y-4">
          {renderConfirmStep()}

          {renderInstructions && renderInstructions(instructions, setInstructions)}

          {generationError && (
            <div className="p-3 bg-[var(--danger)]/10 border border-[var(--danger)] rounded text-sm text-[var(--danger)]">
              {generationError}
            </div>
          )}
        </div>
      )}

      {step === 'preview' && result && (
        <div className="space-y-4">
          {renderPreviewStep(result)}
          {previewWarning}
        </div>
      )}
    </Modal>
  );
}

// Re-export the extracted components for convenience
export { MergeInstructionsField } from './MergeInstructionsField';
export { DeferredExecutionWarning } from './DeferredExecutionWarning';

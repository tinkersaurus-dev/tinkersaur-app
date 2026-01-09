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
import { Modal, Button } from '~/core/components/ui';

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

/**
 * Standard instructions textarea for merge modals
 */
export function MergeInstructionsField({
  value,
  onChange,
  placeholder = 'E.g., Prioritize specific aspects...',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text)] mb-2">
        Additional Instructions (optional)
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-24 px-3 py-2 text-sm border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--primary)]"
      />
    </div>
  );
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

/**
 * Default preview warning component for deferred execution modals
 */
export function DeferredExecutionWarning({ message }: { message?: string }) {
  return (
    <div className="p-3 bg-[var(--warning)]/10 border border-[var(--warning)] rounded">
      <p className="text-sm text-[var(--text)]">
        <strong>Note:</strong>{' '}
        {message || 'The merge will be executed when you save the intake results.'}
      </p>
    </div>
  );
}

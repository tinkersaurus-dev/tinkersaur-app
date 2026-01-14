/**
 * Use Case Merge Modal
 * Two-step modal for merging multiple use cases using LLM assistance
 * Step 1: Confirm use cases and provide optional instructions
 * Step 2: Preview merged use case and confirm merge
 */

import { useState, useMemo } from 'react';
import { FiClipboard, FiZap, FiAlertTriangle } from 'react-icons/fi';
import { Modal, Button, Card } from '~/core/components/ui';
import type { UseCase, Solution } from '~/core/entities/product-management/types';
import { useMergeUseCasesLLM } from '../hooks/useMergeUseCasesLLM';
import { useMergeUseCases } from '../mutations';

interface UseCaseMergeModalProps {
  open: boolean;
  onClose: () => void;
  selectedUseCases: UseCase[];
  teamId: string;
  solutions?: Solution[];
}

export function UseCaseMergeModal({
  open,
  onClose,
  selectedUseCases,
  teamId,
  solutions = [],
}: UseCaseMergeModalProps) {
  const [instructions, setInstructions] = useState('');

  const { merge: llmMerge, isLoading: llmLoading, result: llmResult, error: llmError, reset } = useMergeUseCasesLLM();
  const mergeMutation = useMergeUseCases();

  // Derive step from whether we have a result
  const step = llmResult ? 'preview' : 'confirm';

  // Check solution consistency
  const { hasConflictingSolutions, commonSolution } = useMemo(() => {
    const distinct = [...new Set(
      selectedUseCases
        .filter(uc => uc.solutionId)
        .map(uc => uc.solutionId)
    )];

    const hasConflict = distinct.length > 1;
    const commonId = distinct.length === 1 ? distinct[0] : null;
    const common = commonId
      ? solutions.find(s => s.id === commonId)
      : null;

    return {
      hasConflictingSolutions: hasConflict,
      commonSolution: common,
    };
  }, [selectedUseCases, solutions]);

  const handleGeneratePreview = () => {
    llmMerge(selectedUseCases, teamId, instructions || undefined);
  };

  const handleConfirmMerge = async () => {
    if (!llmResult) return;

    try {
      await mergeMutation.mutateAsync({
        teamId,
        useCaseIds: selectedUseCases.map((uc) => uc.id),
        mergedUseCase: {
          ...llmResult,
        },
      });
      setInstructions('');
      reset();
      onClose();
    } catch {
      // Error is handled by mutation hook
    }
  };

  const handleClose = () => {
    setInstructions('');
    reset();
    onClose();
  };

  // Custom footer for each step
  const confirmFooter = (
    <div className="flex justify-end gap-3">
      <Button variant="default" onClick={handleClose}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleGeneratePreview}
        disabled={llmLoading || selectedUseCases.length < 2 || hasConflictingSolutions}
      >
        {llmLoading ? (
          <>
            <FiZap className="animate-pulse mr-2" />
            Generating...
          </>
        ) : (
          <>
            <FiZap className="mr-2" />
            Generate Merged Use Case
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
      <Button
        variant="primary"
        onClick={handleConfirmMerge}
        disabled={mergeMutation.isPending}
      >
        {mergeMutation.isPending ? 'Merging...' : 'Confirm Merge'}
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title={`Merge ${selectedUseCases.length} Use Cases`}
      width={800}
      footer={step === 'confirm' ? confirmFooter : previewFooter}
    >
      {step === 'confirm' && (
        <div className="space-y-4">
          {/* Solution conflict warning */}
          {hasConflictingSolutions && (
            <div className="p-3 bg-[var(--danger)]/10 border border-[var(--danger)] rounded text-sm text-[var(--danger)] flex items-start gap-2">
              <FiAlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Cannot merge:</strong> Selected use cases belong to different solutions.
                You can only merge use cases that share the same solution or have no solution assigned.
              </div>
            </div>
          )}

          {/* Summary of use cases being merged */}
          <div className="text-sm text-[var(--text-muted)]">
            The following use cases will be merged into a single use case:
          </div>

          <div className="grid grid-cols-1 gap-3 max-h-[250px] overflow-y-auto">
            {selectedUseCases.map((useCase) => (
              <Card key={useCase.id} className="p-3">
                <div className="flex items-center gap-3">
                  <FiClipboard className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-[var(--text)] truncate">
                      {useCase.name}
                    </div>
                    <div className="text-sm text-[var(--text-muted)] truncate">
                      {useCase.description || 'No description'}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Solution info */}
          {commonSolution && (
            <div className="text-sm text-[var(--text-muted)]">
              The merged use case will be assigned to: <strong>{commonSolution.name}</strong>
            </div>
          )}

          {/* Optional instructions */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              Additional Instructions (optional)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="E.g., Focus on the core workflow, emphasize mobile experience..."
              className="w-full h-24 px-3 py-2 text-sm border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          {/* LLM Error */}
          {llmError && (
            <div className="p-3 bg-[var(--danger)]/10 border border-[var(--danger)] rounded text-sm text-[var(--danger)]">
              {llmError}
            </div>
          )}
        </div>
      )}

      {step === 'preview' && llmResult && (
        <div className="space-y-4">
          {/* Preview merged use case */}
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <FiClipboard className="w-6 h-6 text-blue-500" />
              <div className="text-lg font-medium text-[var(--text)]">
                {llmResult.name}
              </div>
            </div>

            <p className="text-sm text-[var(--text)]">{llmResult.description}</p>

            {commonSolution && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <span className="text-sm text-[var(--text-muted)]">Solution: </span>
                <span className="text-sm font-medium text-[var(--text)]">{commonSolution.name}</span>
              </div>
            )}
          </Card>

          <div className="p-3 bg-[var(--warning)]/10 border border-[var(--warning)] rounded">
            <p className="text-sm text-[var(--text)]">
              <strong>Note:</strong> The original {selectedUseCases.length} use cases will be
              marked as merged and hidden from lists. All their requirements, design work,
              persona associations, and feedback associations will be transferred to the new use case.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

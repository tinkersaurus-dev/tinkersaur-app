/**
 * Intake Use Case Merge Modal
 * Merges a new intake use case with existing database use cases
 * Uses LLM to combine use cases into a single merged use case
 *
 * Note: This modal does NOT execute the merge immediately. Instead, it
 * returns the merge configuration to the parent, which will execute it
 * when the intake results are saved (to ensure data integrity if abandoned).
 */

import { useState, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { FiClipboard, FiAlertTriangle, FiZap } from 'react-icons/fi';
import { Modal, Button, Card } from '~/core/components/ui';
import type { ExtractedUseCase } from '~/core/entities/discovery';
import type { UseCase, MergedUseCaseData, Solution } from '~/core/entities/product-management/types';
import { useCaseApi } from '~/core/entities/product-management/api';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { useMergeUseCasesLLM } from '~/product-management/hooks/useMergeUseCasesLLM';

export interface PendingUseCaseMerge {
  intakeUseCaseIndex: number;
  existingUseCaseIds: string[];
  mergedUseCase: MergedUseCaseData;
}

interface IntakeUseCaseMergeModalProps {
  open: boolean;
  onClose: () => void;
  intakeUseCase: ExtractedUseCase;
  intakeUseCaseIndex: number;
  existingUseCaseIds: string[];
  onMergeConfirmed: (pendingMerge: PendingUseCaseMerge) => void;
  intakeSolutionId?: string | null;
  solutions?: Solution[];
}

export function IntakeUseCaseMergeModal({
  open,
  onClose,
  intakeUseCase,
  intakeUseCaseIndex,
  existingUseCaseIds,
  onMergeConfirmed,
  intakeSolutionId,
  solutions = [],
}: IntakeUseCaseMergeModalProps) {
  const [instructions, setInstructions] = useState('');

  // Fetch the existing use cases details using useQueries (proper hook usage)
  const existingUseCaseQueries = useQueries({
    queries: existingUseCaseIds.map(id => ({
      queryKey: queryKeys.useCases.detail(id),
      queryFn: () => useCaseApi.get(id),
      enabled: !!id,
      staleTime: STALE_TIMES.useCases,
    })),
  });
  const existingUseCases = existingUseCaseQueries
    .map(q => q.data)
    .filter((uc): uc is UseCase => uc != null);
  const existingLoading = existingUseCaseQueries.some(q => q.isLoading);

  const { merge: llmMerge, isLoading: llmLoading, result: llmResult, error: llmError } = useMergeUseCasesLLM();

  // Derive step from whether we have a result
  const step = llmResult ? 'preview' : 'confirm';

  // Check solution compatibility
  const { hasConflictingSolutions, commonSolution } = useMemo(() => {
    // Get all solution IDs (from existing use cases and intake solution)
    const solutionIds = new Set<string>();

    existingUseCases.forEach(uc => {
      if (uc.solutionId) solutionIds.add(uc.solutionId);
    });

    if (intakeSolutionId) solutionIds.add(intakeSolutionId);

    const hasConflict = solutionIds.size > 1;
    const commonId = solutionIds.size === 1 ? Array.from(solutionIds)[0] : null;
    const common = commonId ? solutions.find(s => s.id === commonId) : null;

    return {
      hasConflictingSolutions: hasConflict,
      commonSolution: common,
    };
  }, [existingUseCases, intakeSolutionId, solutions]);

  const handleGeneratePreview = () => {
    if (existingUseCases.length === 0) return;

    // Convert intake use case to the format expected by LLM
    const allUseCases = [
      {
        name: intakeUseCase.name,
        description: intakeUseCase.description,
      },
      ...existingUseCases.map(uc => ({
        name: uc.name,
        description: uc.description,
      })),
    ];

    llmMerge(allUseCases, instructions || undefined);
  };

  const handleConfirmMerge = () => {
    if (!llmResult) return;

    // Return the merge configuration to the parent - don't execute yet
    onMergeConfirmed({
      intakeUseCaseIndex,
      existingUseCaseIds,
      mergedUseCase: llmResult,
    });
    onClose();
  };

  const handleClose = () => {
    setInstructions('');
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
        disabled={llmLoading || existingLoading || existingUseCases.length === 0 || hasConflictingSolutions}
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
      >
        Confirm Merge
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title="Merge with Existing Use Cases"
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
                <strong>Cannot merge:</strong> The selected use cases belong to different solutions.
                You can only merge use cases that share the same solution or have no solution assigned.
              </div>
            </div>
          )}

          <div className="text-sm text-[var(--text-muted)]">
            Merge the new intake use case with existing use cases:
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {/* New use case from intake */}
            <Card className="p-3">
              <div className="text-xs font-medium text-[var(--text-muted)] mb-2">
                New (from intake)
              </div>
              <div className="flex items-center gap-3">
                <FiClipboard className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-[var(--text)] truncate">
                    {intakeUseCase.name}
                  </div>
                  <div className="text-sm text-[var(--text-muted)] truncate">
                    {intakeUseCase.description || 'No description'}
                  </div>
                </div>
              </div>
            </Card>

            {/* Existing use cases */}
            {existingLoading ? (
              <div className="text-sm text-[var(--text-muted)]">Loading existing use cases...</div>
            ) : existingUseCases.length > 0 ? (
              existingUseCases.map((useCase) => (
                <Card key={useCase.id} className="p-3 border-[var(--primary)]">
                  <div className="text-xs font-medium text-[var(--text-muted)] mb-2">
                    Existing
                  </div>
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
              ))
            ) : (
              <div className="text-sm text-[var(--danger)]">Use cases not found</div>
            )}
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
              placeholder="E.g., Prioritize the intake use case's workflow..."
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
              <strong>Note:</strong> The merge will be executed when you save the intake results.
              The existing use cases will be marked as merged and hidden, with all their requirements,
              design work, persona associations, and feedback associations transferred to the new merged use case.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

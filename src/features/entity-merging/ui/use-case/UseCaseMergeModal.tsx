/**
 * Use Case Merge Modal
 * Supports both Simple Merge (keep target name/description) and LLM Merge (AI-generated)
 * First selected use case is the target; others are merged into it
 */

import { useState, useMemo } from 'react';
import { FiClipboard, FiZap, FiAlertTriangle, FiArrowRight } from 'react-icons/fi';
import { Modal, Button, Card, Input } from '@/shared/ui';
import type { UseCase } from '@/entities/use-case';
import type { Solution } from '@/entities/solution';
import { useMergeUseCasesLLM } from '../../api/hooks/useMergeUseCasesLLM';
import { useMergeUseCases } from '../../api/hooks/useMergeUseCases';

type MergeMode = 'simple' | 'llm';

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
  const [mergeMode, setMergeMode] = useState<MergeMode>('simple');
  const [instructions, setInstructions] = useState('');

  const { merge: llmMerge, isLoading: llmLoading, result: llmResult, error: llmError, reset } = useMergeUseCasesLLM();
  const mergeMutation = useMergeUseCases();

  // First use case is the target, rest are sources
  const targetUseCase = selectedUseCases[0];
  const sourceUseCases = selectedUseCases.slice(1);

  // Derive step: for LLM mode, show preview after generation
  const step = mergeMode === 'llm' && llmResult ? 'preview' : 'confirm';

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
    try {
      await mergeMutation.mutateAsync({
        teamId,
        targetUseCaseId: targetUseCase.id,
        sourceUseCaseIds: sourceUseCases.map((uc) => uc.id),
        // For LLM merge, include the generated name/description
        // For simple merge, omit mergedUseCase to keep target's name/description
        mergedUseCase: mergeMode === 'llm' && llmResult ? llmResult : undefined,
      });
      handleClose();
    } catch {
      // Error is handled by mutation hook
    }
  };

  const handleClose = () => {
    setMergeMode('simple');
    setInstructions('');
    reset();
    onClose();
  };

  const isLoading = llmLoading || mergeMutation.isPending;
  const canMerge = selectedUseCases.length >= 2 && !hasConflictingSolutions;

  // Footer for confirm step
  const confirmFooter = (
    <div className="flex justify-end gap-3">
      <Button variant="default" onClick={handleClose}>
        Cancel
      </Button>
      {mergeMode === 'simple' ? (
        <Button
          variant="primary"
          onClick={handleConfirmMerge}
          disabled={!canMerge || isLoading}
        >
          {mergeMutation.isPending ? 'Merging...' : 'Merge Use Cases'}
        </Button>
      ) : (
        <Button
          variant="primary"
          onClick={handleGeneratePreview}
          disabled={!canMerge || isLoading}
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
      )}
    </div>
  );

  // Footer for LLM preview step
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

          {/* Merge mode toggle */}
          <div className="flex gap-2">
            <Button
              variant={mergeMode === 'simple' ? 'primary' : 'default'}
              onClick={() => setMergeMode('simple')}
              size="small"
            >
              Simple Merge
            </Button>
            <Button
              variant={mergeMode === 'llm' ? 'primary' : 'default'}
              onClick={() => setMergeMode('llm')}
              size="small"
            >
              <FiZap className="mr-1" />
              AI Merge
            </Button>
          </div>

          {/* Target use case (first selected) */}
          <div>
            <div className="text-sm font-medium text-[var(--text)] mb-2">
              Target Use Case
            </div>
            <Card className="p-3 border-2 border-blue-500">
              <div className="flex items-center gap-3">
                <FiClipboard className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[var(--text)] truncate">
                    {targetUseCase?.name}
                  </div>
                  <div className="text-sm text-[var(--text-muted)] truncate">
                    {targetUseCase?.description || 'No description'}
                  </div>
                </div>
                <FiArrowRight className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
              </div>
            </Card>
          </div>

          {/* Source use cases (to be merged in) */}
          <div>
            <div className="text-sm font-medium text-[var(--text)] mb-2">
              Merging In ({sourceUseCases.length} use case{sourceUseCases.length !== 1 ? 's' : ''})
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto">
              {sourceUseCases.map((useCase) => (
                <Card key={useCase.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <FiClipboard className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
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
          </div>

          {/* Solution info */}
          {commonSolution && (
            <div className="text-sm text-[var(--text-muted)]">
              Solution: <strong>{commonSolution.name}</strong>
            </div>
          )}

          {/* LLM mode: instructions input */}
          {mergeMode === 'llm' && (
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Additional Instructions (optional)
              </label>
              <Input.TextArea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="E.g., Focus on the core workflow, emphasize mobile experience..."
                rows={3}
                size="small"
              />
            </div>
          )}

          {/* Mode-specific info */}
          <div className="p-3 bg-[var(--info)]/10 border border-[var(--info)] rounded">
            <p className="text-sm text-[var(--text)]">
              {mergeMode === 'simple' ? (
                <>
                  <strong>Simple Merge:</strong> The target use case will keep its name and description.
                  All requirements, design work, personas, feedback, and quotes from the other use cases
                  will be transferred to it.
                </>
              ) : (
                <>
                  <strong>AI Merge:</strong> AI will generate a new name and description that combines
                  all selected use cases. All requirements, design work, personas, feedback, and quotes
                  will be transferred to the target.
                </>
              )}
            </p>
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
              <strong>Note:</strong> The {sourceUseCases.length} source use case{sourceUseCases.length !== 1 ? 's' : ''} will be
              marked as merged. All their requirements, design work, persona associations, feedback,
              and quotes will be transferred to the target use case.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

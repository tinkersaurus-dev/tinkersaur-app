/**
 * Intake Use Case Merge Modal
 * Merges a new intake use case with existing database use cases
 * Uses LLM to combine use cases into a single merged use case
 *
 * Note: This modal does NOT execute the merge immediately. Instead, it
 * returns the merge configuration to the parent, which will execute it
 * when the intake results are saved (to ensure data integrity if abandoned).
 */

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { FiClipboard, FiAlertTriangle, FiArrowRight } from 'react-icons/fi';
import { Card } from '@/shared/ui';
import { useAuthStore } from '@/features/auth';
import type { ExtractedUseCase } from '@/entities/intake-result';
import type { UseCase, MergedUseCaseData } from '@/entities/use-case';
import type { Solution } from '@/entities/solution';
import { useCaseApi } from '@/entities/use-case';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES } from '@/shared/lib/query';
import { useMergeUseCasesLLM } from '../../api/hooks/useMergeUseCasesLLM';
import { TwoStepMergeModal } from '../shared/TwoStepMergeModal';
import { MergeInstructionsField } from '../shared/MergeInstructionsField';
import { DeferredExecutionWarning } from '../shared/DeferredExecutionWarning';

export interface PendingUseCaseMerge {
  intakeUseCaseIndex: number;
  targetUseCaseId: string;
  sourceUseCaseIds: string[];
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
  // Get teamId for API calls
  const teamId = useAuthStore((state) => state.selectedTeam?.teamId ?? '');

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

  const { merge: llmMerge, isLoading: llmLoading, result: llmResult, error: llmError, reset } = useMergeUseCasesLLM();

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

    llmMerge(allUseCases, teamId);
  };

  const handleConfirmMerge = () => {
    if (!llmResult || existingUseCases.length === 0) return;

    // First existing use case is the target, others become sources
    const targetUseCaseId = existingUseCases[0].id;
    const sourceUseCaseIds = existingUseCases.slice(1).map(uc => uc.id);

    // Return the merge configuration to the parent - don't execute yet
    onMergeConfirmed({
      intakeUseCaseIndex,
      targetUseCaseId,
      sourceUseCaseIds,
      mergedUseCase: llmResult,
    });
    onClose();
  };

  return (
    <TwoStepMergeModal
      open={open}
      onClose={onClose}
      title="Merge with Existing Use Cases"
      isGenerating={llmLoading}
      generationError={llmError}
      result={llmResult}
      onReset={reset}
      onGenerate={handleGeneratePreview}
      onConfirm={handleConfirmMerge}
      generateButtonLabel="Generate Merged Use Case"
      canGenerate={!existingLoading && existingUseCases.length > 0 && !hasConflictingSolutions}
      renderConfirmStep={() => (
        <>
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

            {/* Existing use cases - first one is the target */}
            {existingLoading ? (
              <div className="text-sm text-[var(--text-muted)]">Loading existing use cases...</div>
            ) : existingUseCases.length > 0 ? (
              existingUseCases.map((useCase, index) => (
                <Card
                  key={useCase.id}
                  className={`p-3 ${index === 0 ? 'border-2 border-blue-500' : ''}`}
                >
                  <div className="text-xs font-medium text-[var(--text-muted)] mb-2">
                    {index === 0 ? 'Target (existing)' : 'Merging in (existing)'}
                  </div>
                  <div className="flex items-center gap-3">
                    <FiClipboard className={`w-5 h-5 flex-shrink-0 ${index === 0 ? 'text-blue-500' : 'text-[var(--text-muted)]'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-[var(--text)] truncate">
                        {useCase.name}
                      </div>
                      <div className="text-sm text-[var(--text-muted)] truncate">
                        {useCase.description || 'No description'}
                      </div>
                    </div>
                    {index === 0 && <FiArrowRight className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />}
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
        </>
      )}
      renderInstructions={(value, onChange) => (
        <MergeInstructionsField
          value={value}
          onChange={onChange}
          placeholder="E.g., Prioritize the intake use case's workflow..."
        />
      )}
      renderPreviewStep={(result) => (
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <FiClipboard className="w-6 h-6 text-blue-500" />
            <div className="text-lg font-medium text-[var(--text)]">
              {result.name}
            </div>
          </div>

          <p className="text-sm text-[var(--text)]">{result.description}</p>

          {commonSolution && (
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <span className="text-sm text-[var(--text-muted)]">Solution: </span>
              <span className="text-sm font-medium text-[var(--text)]">{commonSolution.name}</span>
            </div>
          )}
        </Card>
      )}
      previewWarning={
        <DeferredExecutionWarning message="The merge will be executed when you save the intake results. The target use case will receive the AI-generated name and description, and all quotes from the intake. Other existing use cases will be marked as merged, with their requirements, design work, persona associations, and feedback transferred to the target." />
      }
    />
  );
}

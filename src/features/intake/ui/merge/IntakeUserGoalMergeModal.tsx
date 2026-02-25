/**
 * Intake User Goal Merge Modal
 * Merges a new intake user goal with existing database user goals
 * Uses LLM to combine user goals into a single merged user goal
 *
 * Note: This modal does NOT execute the merge immediately. Instead, it
 * returns the merge configuration to the parent, which will execute it
 * when the intake results are saved (to ensure data integrity if abandoned).
 */

import { useQueries } from '@tanstack/react-query';
import { FiClipboard, FiArrowRight } from 'react-icons/fi';
import { Card } from '@/shared/ui';
import { useAuthStore } from '@/shared/auth';
import type { ExtractedUserGoal } from '@/entities/intake-result';
import type { UserGoal } from '@/entities/user-goal';
import { userGoalApi } from '@/entities/user-goal';
import { queryKeys } from '@/shared/lib/query';
import { STALE_TIMES } from '@/shared/lib/query';
import {
  useMergeUserGoalsLLM,
  TwoStepMergeModal,
  MergeInstructionsField,
  DeferredExecutionWarning,
} from '@/features/entity-merging';
import type { PendingUserGoalMerge } from '../../model/types';

interface IntakeUserGoalMergeModalProps {
  open: boolean;
  onClose: () => void;
  intakeUserGoal: ExtractedUserGoal;
  intakeUserGoalIndex: number;
  existingUserGoalIds: string[];
  onMergeConfirmed: (pendingMerge: PendingUserGoalMerge) => void;
}

export function IntakeUserGoalMergeModal({
  open,
  onClose,
  intakeUserGoal,
  intakeUserGoalIndex,
  existingUserGoalIds,
  onMergeConfirmed,
}: IntakeUserGoalMergeModalProps) {
  // Get teamId for API calls
  const teamId = useAuthStore((state) => state.selectedTeam?.teamId ?? '');

  // Fetch the existing user goals details using useQueries (proper hook usage)
  const existingUserGoalQueries = useQueries({
    queries: existingUserGoalIds.map(id => ({
      queryKey: queryKeys.userGoals.detail(id),
      queryFn: () => userGoalApi.get(id),
      enabled: !!id,
      staleTime: STALE_TIMES.userGoals,
    })),
  });
  const existingUserGoals = existingUserGoalQueries
    .map(q => q.data)
    .filter((ug): ug is UserGoal => ug != null);
  const existingLoading = existingUserGoalQueries.some(q => q.isLoading);

  const { merge: llmMerge, isLoading: llmLoading, result: llmResult, error: llmError, reset } = useMergeUserGoalsLLM();

  const handleGeneratePreview = () => {
    if (existingUserGoals.length === 0) return;

    // Convert intake user goal to the format expected by LLM
    const allUserGoals = [
      {
        name: intakeUserGoal.name,
        description: intakeUserGoal.description,
      },
      ...existingUserGoals.map(ug => ({
        name: ug.name,
        description: ug.description,
      })),
    ];

    llmMerge(allUserGoals, teamId);
  };

  const handleConfirmMerge = () => {
    if (!llmResult || existingUserGoals.length === 0) return;

    // First existing user goal is the target, others become sources
    const targetUserGoalId = existingUserGoals[0].id;
    const sourceUserGoalIds = existingUserGoals.slice(1).map(ug => ug.id);

    // Return the merge configuration to the parent - don't execute yet
    onMergeConfirmed({
      intakeUserGoalIndex,
      targetUserGoalId,
      sourceUserGoalIds,
      mergedUserGoal: llmResult,
      quotes: intakeUserGoal.quotes,  // Pass intake user goal's quotes for linking to target
    });
    onClose();
  };

  return (
    <TwoStepMergeModal
      open={open}
      onClose={onClose}
      title="Merge with Existing User Goals"
      isGenerating={llmLoading}
      generationError={llmError}
      result={llmResult}
      onReset={reset}
      onGenerate={handleGeneratePreview}
      onConfirm={handleConfirmMerge}
      generateButtonLabel="Generate Merged User Goal"
      canGenerate={!existingLoading && existingUserGoals.length > 0}
      renderConfirmStep={() => (
        <>
          <div className="text-sm text-[var(--text-muted)]">
            Merge the new intake user goal with existing user goals:
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {/* New user goal from intake */}
            <Card className="p-3">
              <div className="text-xs font-medium text-[var(--text-muted)] mb-2">
                New (from intake)
              </div>
              <div className="flex items-center gap-3">
                <FiClipboard className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-[var(--text)] truncate">
                    {intakeUserGoal.name}
                  </div>
                  <div className="text-sm text-[var(--text-muted)] truncate">
                    {intakeUserGoal.description || 'No description'}
                  </div>
                </div>
              </div>
            </Card>

            {/* Existing user goals - first one is the target */}
            {existingLoading ? (
              <div className="text-sm text-[var(--text-muted)]">Loading existing user goals...</div>
            ) : existingUserGoals.length > 0 ? (
              existingUserGoals.map((userGoal, index) => (
                <Card
                  key={userGoal.id}
                  className={`p-3 ${index === 0 ? 'border-2 border-blue-500' : ''}`}
                >
                  <div className="text-xs font-medium text-[var(--text-muted)] mb-2">
                    {index === 0 ? 'Target (existing)' : 'Merging in (existing)'}
                  </div>
                  <div className="flex items-center gap-3">
                    <FiClipboard className={`w-5 h-5 flex-shrink-0 ${index === 0 ? 'text-blue-500' : 'text-[var(--text-muted)]'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-[var(--text)] truncate">
                        {userGoal.name}
                      </div>
                      <div className="text-sm text-[var(--text-muted)] truncate">
                        {userGoal.description || 'No description'}
                      </div>
                    </div>
                    {index === 0 && <FiArrowRight className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />}
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-sm text-[var(--danger)]">User goals not found</div>
            )}
          </div>
        </>
      )}
      renderInstructions={(value, onChange) => (
        <MergeInstructionsField
          value={value}
          onChange={onChange}
          placeholder="E.g., Prioritize the intake user goal's workflow..."
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
        </Card>
      )}
      previewWarning={
        <DeferredExecutionWarning message="The merge will be executed when you save the intake results. The target user goal will receive the AI-generated name and description, and all quotes from the intake. Other existing user goals will be marked as merged, with their persona associations and feedback transferred to the target." />
      }
    />
  );
}

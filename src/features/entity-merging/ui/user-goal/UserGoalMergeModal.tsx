/**
 * User Goal Merge Modal
 * Supports both Simple Merge (keep target name/description) and LLM Merge (AI-generated)
 * First selected user goal is the target; others are merged into it
 */

import { useState } from 'react';
import { FiClipboard, FiZap, FiArrowRight } from 'react-icons/fi';
import { Modal, Button, Card, Input } from '@/shared/ui';
import type { UserGoal } from '@/entities/user-goal';
import { useMergeUserGoalsLLM } from '../../api/hooks/useMergeUserGoalsLLM';
import { useMergeUserGoals } from '../../api/hooks/useMergeUserGoals';

type MergeMode = 'simple' | 'llm';

interface UserGoalMergeModalProps {
  open: boolean;
  onClose: () => void;
  selectedUserGoals: UserGoal[];
  teamId: string;
}

export function UserGoalMergeModal({
  open,
  onClose,
  selectedUserGoals,
  teamId,
}: UserGoalMergeModalProps) {
  const [mergeMode, setMergeMode] = useState<MergeMode>('simple');
  const [instructions, setInstructions] = useState('');

  const { merge: llmMerge, isLoading: llmLoading, result: llmResult, error: llmError, reset } = useMergeUserGoalsLLM();
  const mergeMutation = useMergeUserGoals();

  // First user goal is the target, rest are sources
  const targetUserGoal = selectedUserGoals[0];
  const sourceUserGoals = selectedUserGoals.slice(1);

  // Derive step: for LLM mode, show preview after generation
  const step = mergeMode === 'llm' && llmResult ? 'preview' : 'confirm';

  const handleGeneratePreview = () => {
    llmMerge(selectedUserGoals, teamId, instructions || undefined);
  };

  const handleConfirmMerge = async () => {
    try {
      await mergeMutation.mutateAsync({
        teamId,
        targetUserGoalId: targetUserGoal.id,
        sourceUserGoalIds: sourceUserGoals.map((ug) => ug.id),
        mergedUserGoal: mergeMode === 'llm' && llmResult ? llmResult : undefined,
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
  const canMerge = selectedUserGoals.length >= 2;

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
          {mergeMutation.isPending ? 'Merging...' : 'Merge User Goals'}
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
              Generate Merged User Goal
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
      title={`Merge ${selectedUserGoals.length} User Goals`}
      width={800}
      footer={step === 'confirm' ? confirmFooter : previewFooter}
    >
      {step === 'confirm' && (
        <div className="space-y-4">
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

          {/* Target user goal (first selected) */}
          <div>
            <div className="text-sm font-medium text-[var(--text)] mb-2">
              Target User Goal
            </div>
            <Card className="p-3 border-2 border-blue-500">
              <div className="flex items-center gap-3">
                <FiClipboard className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[var(--text)] truncate">
                    {targetUserGoal?.name}
                  </div>
                  <div className="text-sm text-[var(--text-muted)] truncate">
                    {targetUserGoal?.description || 'No description'}
                  </div>
                </div>
                <FiArrowRight className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
              </div>
            </Card>
          </div>

          {/* Source user goals (to be merged in) */}
          <div>
            <div className="text-sm font-medium text-[var(--text)] mb-2">
              Merging In ({sourceUserGoals.length} user goal{sourceUserGoals.length !== 1 ? 's' : ''})
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto">
              {sourceUserGoals.map((userGoal) => (
                <Card key={userGoal.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <FiClipboard className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-[var(--text)] truncate">
                        {userGoal.name}
                      </div>
                      <div className="text-sm text-[var(--text-muted)] truncate">
                        {userGoal.description || 'No description'}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* LLM mode: instructions input */}
          {mergeMode === 'llm' && (
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Additional Instructions (optional)
              </label>
              <Input.TextArea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="E.g., Focus on the core user need, emphasize pain points..."
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
                  <strong>Simple Merge:</strong> The target user goal will keep its name and description.
                  All personas, feedback, and quotes from the other user goals will be transferred to it.
                </>
              ) : (
                <>
                  <strong>AI Merge:</strong> AI will generate a new name and description that combines
                  all selected user goals. All personas, feedback, and quotes will be transferred to the target.
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
          {/* Preview merged user goal */}
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <FiClipboard className="w-6 h-6 text-blue-500" />
              <div className="text-lg font-medium text-[var(--text)]">
                {llmResult.name}
              </div>
            </div>

            <p className="text-sm text-[var(--text)]">{llmResult.description}</p>
          </Card>

          <div className="p-3 bg-[var(--warning)]/10 border border-[var(--warning)] rounded">
            <p className="text-sm text-[var(--text)]">
              <strong>Note:</strong> The {sourceUserGoals.length} source user goal{sourceUserGoals.length !== 1 ? 's' : ''} will be
              marked as merged. All their persona associations, feedback,
              and quotes will be transferred to the target user goal.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

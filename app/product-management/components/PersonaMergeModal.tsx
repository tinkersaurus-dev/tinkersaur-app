/**
 * Persona Merge Modal
 * Two-step modal for merging multiple personas using LLM assistance
 * Step 1: Confirm personas and provide optional instructions
 * Step 2: Preview merged persona and confirm merge
 */

import { useState } from 'react';
import { FiUser, FiTarget, FiAlertCircle, FiZap } from 'react-icons/fi';
import { Modal, Button, Card, Input } from '~/core/components/ui';
import type { Persona } from '~/core/entities/product-management/types';
import { useMergePersonasLLM } from '../hooks/useMergePersonasLLM';
import { useMergePersonas } from '../mutations';

interface PersonaMergeModalProps {
  open: boolean;
  onClose: () => void;
  selectedPersonas: Persona[];
  teamId: string;
}

export function PersonaMergeModal({
  open,
  onClose,
  selectedPersonas,
  teamId,
}: PersonaMergeModalProps) {
  const [instructions, setInstructions] = useState('');

  const { merge: llmMerge, isLoading: llmLoading, result: llmResult, error: llmError, reset } = useMergePersonasLLM();
  const mergeMutation = useMergePersonas();

  // Derive step from whether we have a result
  const step = llmResult ? 'preview' : 'confirm';

  const handleGeneratePreview = () => {
    llmMerge(selectedPersonas, teamId, instructions || undefined);
  };

  const handleConfirmMerge = async () => {
    if (!llmResult) return;

    try {
      await mergeMutation.mutateAsync({
        teamId,
        personaIds: selectedPersonas.map((p) => p.id),
        mergedPersona: llmResult,
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
        disabled={llmLoading || selectedPersonas.length < 2}
      >
        {llmLoading ? (
          <>
            <FiZap className="animate-pulse mr-2" />
            Generating...
          </>
        ) : (
          <>
            <FiZap className="mr-2" />
            Generate Merged Persona
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
      title={`Merge ${selectedPersonas.length} Personas`}
      width={800}
      footer={step === 'confirm' ? confirmFooter : previewFooter}
    >
      {step === 'confirm' && (
        <div className="space-y-4">
          {/* Summary of personas being merged */}
          <div className="text-sm text-[var(--text-muted)]">
            The following personas will be merged into a single persona:
          </div>

          <div className="grid grid-cols-1 gap-3 max-h-[250px] overflow-y-auto">
            {selectedPersonas.map((persona) => (
              <Card key={persona.id} className="p-3">
                <div className="flex items-center gap-3">
                  <FiUser className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-[var(--text)] truncate">
                      {persona.name}
                    </div>
                    <div className="text-sm text-[var(--text-muted)] truncate">
                      {persona.role || 'No role specified'}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Optional instructions */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              Additional Instructions (optional)
            </label>
            <Input.TextArea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="E.g., Focus on enterprise users, emphasize security concerns..."
              rows={4}
              size="small"
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
          {/* Preview merged persona */}
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <FiUser className="w-6 h-6 text-[var(--primary)]" />
              <div>
                <div className="text-lg font-medium text-[var(--text)]">
                  {llmResult.name}
                </div>
                <div className="text-sm text-[var(--text-muted)]">
                  {llmResult.role || 'No role'}
                </div>
              </div>
            </div>

            <p className="text-sm text-[var(--text)] mb-4">{llmResult.description}</p>

            <div className="grid grid-cols-2 gap-4">
              {/* Goals */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FiTarget className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-[var(--text)]">
                    Goals ({llmResult.goals.length})
                  </span>
                </div>
                <ul className="text-sm text-[var(--text-muted)] space-y-1 max-h-32 overflow-y-auto">
                  {llmResult.goals.slice(0, 5).map((goal, i) => (
                    <li key={i} className="truncate">
                      {goal}
                    </li>
                  ))}
                  {llmResult.goals.length > 5 && (
                    <li className="text-[var(--text-disabled)]">
                      +{llmResult.goals.length - 5} more
                    </li>
                  )}
                </ul>
              </div>

              {/* Pain Points */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FiAlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-[var(--text)]">
                    Pain Points ({llmResult.painPoints.length})
                  </span>
                </div>
                <ul className="text-sm text-[var(--text-muted)] space-y-1 max-h-32 overflow-y-auto">
                  {llmResult.painPoints.slice(0, 5).map((point, i) => (
                    <li key={i} className="truncate">
                      {point}
                    </li>
                  ))}
                  {llmResult.painPoints.length > 5 && (
                    <li className="text-[var(--text-disabled)]">
                      +{llmResult.painPoints.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Demographics */}
            {llmResult.demographics && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <div className="text-sm font-medium text-[var(--text)] mb-2">Demographics</div>
                <div className="grid grid-cols-3 gap-2 text-xs text-[var(--text-muted)]">
                  {llmResult.demographics.education && (
                    <div>
                      <span className="font-medium">Education:</span>{' '}
                      {llmResult.demographics.education}
                    </div>
                  )}
                  {llmResult.demographics.experience && (
                    <div>
                      <span className="font-medium">Experience:</span>{' '}
                      {llmResult.demographics.experience}
                    </div>
                  )}
                  {llmResult.demographics.industry && (
                    <div>
                      <span className="font-medium">Industry:</span>{' '}
                      {llmResult.demographics.industry}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          <div className="p-3 bg-[var(--warning)]/10 border border-[var(--warning)] rounded">
            <p className="text-sm text-[var(--text)]">
              <strong>Note:</strong> The original {selectedPersonas.length} personas will be
              marked as merged and hidden from lists. All their use case and feedback
              associations will be transferred to the new persona.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

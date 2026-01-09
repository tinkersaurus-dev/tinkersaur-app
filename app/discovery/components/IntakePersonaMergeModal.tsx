/**
 * Intake Persona Merge Modal
 * Merges a new intake persona with an existing database persona
 * Uses LLM to combine both personas into a single merged persona
 *
 * Note: This modal does NOT execute the merge immediately. Instead, it
 * returns the merge configuration to the parent, which will execute it
 * when the intake results are saved (to ensure data integrity if abandoned).
 */

import { useState } from 'react';
import { FiUser, FiTarget, FiAlertCircle, FiZap } from 'react-icons/fi';
import { Modal, Button, Card } from '~/core/components/ui';
import type { ExtractedPersona } from '~/core/entities/discovery';
import { useMergePersonasLLM } from '~/product-management/hooks/useMergePersonasLLM';
import { usePersonaQuery } from '~/product-management/queries';
import type { PendingMerge } from '~/discovery/hooks/useSaveIntakeResult';

export type { PendingMerge };

interface IntakePersonaMergeModalProps {
  open: boolean;
  onClose: () => void;
  intakePersona: ExtractedPersona;
  intakePersonaIndex: number;
  existingPersonaId: string;
  onMergeConfirmed: (pendingMerge: PendingMerge) => void;
}

export function IntakePersonaMergeModal({
  open,
  onClose,
  intakePersona,
  intakePersonaIndex,
  existingPersonaId,
  onMergeConfirmed,
}: IntakePersonaMergeModalProps) {
  const [instructions, setInstructions] = useState('');

  // Fetch the existing persona details
  const { data: existingPersona, isLoading: existingLoading } = usePersonaQuery(existingPersonaId);

  const { merge: llmMerge, isLoading: llmLoading, result: llmResult, error: llmError, reset } = useMergePersonasLLM();

  // Derive step from whether we have a result
  const step = llmResult ? 'preview' : 'confirm';

  const handleGeneratePreview = () => {
    if (!existingPersona) return;

    // Convert intake persona to the format expected by LLM
    const intakePersonaForLLM = {
      name: intakePersona.name,
      role: intakePersona.role,
      description: intakePersona.description,
      goals: intakePersona.goals,
      painPoints: intakePersona.painPoints,
      demographics: intakePersona.demographics,
    };

    llmMerge([intakePersonaForLLM, existingPersona], instructions || undefined);
  };

  const handleConfirmMerge = () => {
    if (!llmResult) return;

    // Return the merge configuration to the parent - don't execute yet
    onMergeConfirmed({
      intakePersonaIndex,
      existingPersonaId,
      mergedPersona: llmResult,
    });
    setInstructions('');
    reset();
    onClose();
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
        disabled={llmLoading || existingLoading || !existingPersona}
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
      >
        Confirm Merge
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title="Merge with Existing Persona"
      width={800}
      footer={step === 'confirm' ? confirmFooter : previewFooter}
    >
      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="text-sm text-[var(--text-muted)]">
            Merge the new intake persona with an existing persona:
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* New persona from intake */}
            <Card className="p-3">
              <div className="text-xs font-medium text-[var(--text-muted)] mb-2">
                New (from intake)
              </div>
              <div className="flex items-center gap-3">
                <FiUser className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-[var(--text)] truncate">
                    {intakePersona.name}
                  </div>
                  <div className="text-sm text-[var(--text-muted)] truncate">
                    {intakePersona.role || 'No role specified'}
                  </div>
                </div>
              </div>
            </Card>

            {/* Existing persona */}
            <Card className="p-3 border-[var(--primary)]">
              <div className="text-xs font-medium text-[var(--text-muted)] mb-2">
                Existing
              </div>
              {existingLoading ? (
                <div className="text-sm text-[var(--text-muted)]">Loading...</div>
              ) : existingPersona ? (
                <div className="flex items-center gap-3">
                  <FiUser className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-[var(--text)] truncate">
                      {existingPersona.name}
                    </div>
                    <div className="text-sm text-[var(--text-muted)] truncate">
                      {existingPersona.role || 'No role specified'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-[var(--danger)]">Persona not found</div>
              )}
            </Card>
          </div>

          {/* Optional instructions */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              Additional Instructions (optional)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="E.g., Prioritize the intake persona's goals..."
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
          </Card>

          <div className="p-3 bg-[var(--warning)]/10 border border-[var(--warning)] rounded">
            <p className="text-sm text-[var(--text)]">
              <strong>Note:</strong> The merge will be executed when you save the intake results.
              The existing persona will be marked as merged and hidden, with all its associations transferred to the new merged persona.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

/**
 * Intake Persona Merge Modal
 * Merges a new intake persona with an existing database persona
 * Uses LLM to combine both personas into a single merged persona
 *
 * Note: This modal does NOT execute the merge immediately. Instead, it
 * returns the merge configuration to the parent, which will execute it
 * when the intake results are saved (to ensure data integrity if abandoned).
 */

import { FiUser, FiTarget, FiAlertCircle } from 'react-icons/fi';
import { Card } from '~/core/components/ui';
import { useAuthStore } from '~/core/auth';
import type { ExtractedPersona } from '~/core/entities/discovery';
import { useMergePersonasLLM } from '~/discovery/hooks';
import { usePersonaQuery } from '~/product-management/queries';
import { TwoStepMergeModal, MergeInstructionsField, DeferredExecutionWarning } from './TwoStepMergeModal';
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
  // Get teamId for API calls
  const teamId = useAuthStore((state) => state.selectedTeam?.teamId ?? '');

  // Fetch the existing persona details
  const { data: existingPersona, isLoading: existingLoading } = usePersonaQuery(existingPersonaId);

  const { merge: llmMerge, isLoading: llmLoading, result: llmResult, error: llmError, reset } = useMergePersonasLLM();

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

    llmMerge([intakePersonaForLLM, existingPersona], teamId);
  };

  const handleConfirmMerge = () => {
    if (!llmResult) return;

    // Return the merge configuration to the parent - don't execute yet
    onMergeConfirmed({
      intakePersonaIndex,
      existingPersonaId,
      mergedPersona: llmResult,
    });
    onClose();
  };

  return (
    <TwoStepMergeModal
      open={open}
      onClose={onClose}
      title="Merge with Existing Persona"
      isGenerating={llmLoading}
      generationError={llmError}
      result={llmResult}
      onReset={reset}
      onGenerate={handleGeneratePreview}
      onConfirm={handleConfirmMerge}
      generateButtonLabel="Generate Merged Persona"
      canGenerate={!existingLoading && !!existingPersona}
      renderConfirmStep={() => (
        <>
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
        </>
      )}
      renderInstructions={(value, onChange) => (
        <MergeInstructionsField
          value={value}
          onChange={onChange}
          placeholder="E.g., Prioritize the intake persona's goals..."
        />
      )}
      renderPreviewStep={(result) => (
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <FiUser className="w-6 h-6 text-[var(--primary)]" />
            <div>
              <div className="text-lg font-medium text-[var(--text)]">
                {result.name}
              </div>
              <div className="text-sm text-[var(--text-muted)]">
                {result.role || 'No role'}
              </div>
            </div>
          </div>

          <p className="text-sm text-[var(--text)] mb-4">{result.description}</p>

          <div className="grid grid-cols-2 gap-4">
            {/* Goals */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FiTarget className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-[var(--text)]">
                  Goals ({result.goals.length})
                </span>
              </div>
              <ul className="text-sm text-[var(--text-muted)] space-y-1 max-h-32 overflow-y-auto">
                {result.goals.slice(0, 5).map((goal, i) => (
                  <li key={i} className="truncate">
                    {goal}
                  </li>
                ))}
                {result.goals.length > 5 && (
                  <li className="text-[var(--text-disabled)]">
                    +{result.goals.length - 5} more
                  </li>
                )}
              </ul>
            </div>

            {/* Pain Points */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FiAlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-[var(--text)]">
                  Pain Points ({result.painPoints.length})
                </span>
              </div>
              <ul className="text-sm text-[var(--text-muted)] space-y-1 max-h-32 overflow-y-auto">
                {result.painPoints.slice(0, 5).map((point, i) => (
                  <li key={i} className="truncate">
                    {point}
                  </li>
                ))}
                {result.painPoints.length > 5 && (
                  <li className="text-[var(--text-disabled)]">
                    +{result.painPoints.length - 5} more
                  </li>
                )}
              </ul>
            </div>
          </div>
        </Card>
      )}
      previewWarning={
        <DeferredExecutionWarning message="The merge will be executed when you save the intake results. The existing persona will be marked as merged and hidden, with all its associations transferred to the new merged persona." />
      }
    />
  );
}

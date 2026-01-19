/**
 * Persona Merge Modal
 * Supports both Simple Merge (keep target name/description) and LLM Merge (AI-generated)
 * First selected persona is the target; others are merged into it
 */

import { useState } from 'react';
import { FiUser, FiTarget, FiAlertCircle, FiZap, FiArrowRight } from 'react-icons/fi';
import { Modal, Button, Card, Input } from '~/core/components/ui';
import type { Persona } from '~/core/entities/product-management/types';
import { useMergePersonasLLM } from '../hooks/useMergePersonasLLM';
import { useMergePersonas } from '../mutations';

type MergeMode = 'simple' | 'llm';

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
  const [mergeMode, setMergeMode] = useState<MergeMode>('simple');
  const [instructions, setInstructions] = useState('');

  const { merge: llmMerge, isLoading: llmLoading, result: llmResult, error: llmError, reset } = useMergePersonasLLM();
  const mergeMutation = useMergePersonas();

  // First persona is the target, rest are sources
  const targetPersona = selectedPersonas[0];
  const sourcePersonas = selectedPersonas.slice(1);

  // Derive step: for LLM mode, show preview after generation
  const step = mergeMode === 'llm' && llmResult ? 'preview' : 'confirm';

  const handleGeneratePreview = () => {
    llmMerge(selectedPersonas, teamId, instructions || undefined);
  };

  const handleConfirmMerge = async () => {
    try {
      await mergeMutation.mutateAsync({
        teamId,
        targetPersonaId: targetPersona.id,
        sourcePersonaIds: sourcePersonas.map((p) => p.id),
        // For LLM merge, include the generated data
        // For simple merge, omit mergedPersona to keep target's data
        mergedPersona: mergeMode === 'llm' && llmResult ? llmResult : undefined,
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
  const canMerge = selectedPersonas.length >= 2;

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
          {mergeMutation.isPending ? 'Merging...' : 'Merge Personas'}
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
              Generate Merged Persona
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
      title={`Merge ${selectedPersonas.length} Personas`}
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

          {/* Target persona (first selected) */}
          <div>
            <div className="text-sm font-medium text-[var(--text)] mb-2">
              Target Persona
            </div>
            <Card className="p-3 border-2 border-blue-500">
              <div className="flex items-center gap-3">
                <FiUser className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[var(--text)] truncate">
                    {targetPersona?.name}
                  </div>
                  <div className="text-sm text-[var(--text-muted)] truncate">
                    {targetPersona?.role || 'No role specified'}
                  </div>
                </div>
                <FiArrowRight className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
              </div>
            </Card>
          </div>

          {/* Source personas (to be merged in) */}
          <div>
            <div className="text-sm font-medium text-[var(--text)] mb-2">
              Merging In ({sourcePersonas.length} persona{sourcePersonas.length !== 1 ? 's' : ''})
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto">
              {sourcePersonas.map((persona) => (
                <Card key={persona.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <FiUser className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
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
                placeholder="E.g., Focus on enterprise users, emphasize security concerns..."
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
                  <strong>Simple Merge:</strong> The target persona will keep its name, description,
                  role, goals, and pain points. All use case and feedback associations from the other
                  personas will be transferred to it.
                </>
              ) : (
                <>
                  <strong>AI Merge:</strong> AI will generate a new name, description, role, goals,
                  and pain points that combines all selected personas. All use case and feedback
                  associations will be transferred to the target.
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
              <strong>Note:</strong> The {sourcePersonas.length} source persona{sourcePersonas.length !== 1 ? 's' : ''} will be
              marked as merged. All their use case and feedback associations will be transferred
              to the target persona.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

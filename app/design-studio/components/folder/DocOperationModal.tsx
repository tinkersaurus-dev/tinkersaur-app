/**
 * Document Operation Modal Component
 *
 * Modal for operations (Regenerate, Edit) with optional instructions.
 */

import { useState } from 'react';
import { Modal, Input } from '~/core/components/ui';
import type { UserDocument, DocumentStep } from '../../lib/llm/types';

export type DocOperationType = 'regenerate' | 'edit';

export interface DocOperationModalProps {
  open: boolean;
  operationType: DocOperationType;
  document: UserDocument | null;
  onConfirm: (instructions?: string, editedDocument?: UserDocument) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

const operationTitles: Record<DocOperationType, string> = {
  regenerate: 'Regenerate Document',
  edit: 'Edit Document',
};

const operationDescriptions: Record<DocOperationType, string> = {
  regenerate:
    'Regenerate this document based on the original design documentation. The LLM will improve clarity and completeness.',
  edit: 'Manually edit the document fields below.',
};

interface ModalContentProps {
  operationType: DocOperationType;
  document: UserDocument | null;
  isLoading: boolean;
  error: string | null;
  instructions: string;
  setInstructions: (value: string) => void;
  editedDoc: UserDocument | null;
  setEditedDoc: (doc: UserDocument | null) => void;
}

function ModalContent({
  operationType,
  document,
  isLoading,
  error,
  instructions,
  setInstructions,
  editedDoc,
  setEditedDoc,
}: ModalContentProps) {
  const updateEditedDoc = <K extends keyof UserDocument>(
    field: K,
    value: UserDocument[K]
  ) => {
    if (!editedDoc) return;
    setEditedDoc({ ...editedDoc, [field]: value });
  };

  const updateStep = (index: number, field: keyof DocumentStep, value: string) => {
    if (!editedDoc) return;
    const newSteps = [...editedDoc.steps];
    if (field === 'callout') {
      // Handle callout specially - for simplicity, we'll skip callout editing in this basic form
      return;
    }
    newSteps[index] = { ...newSteps[index], [field]: value };
    setEditedDoc({ ...editedDoc, steps: newSteps });
  };

  const addStep = () => {
    if (!editedDoc) return;
    setEditedDoc({
      ...editedDoc,
      steps: [...editedDoc.steps, { title: '', description: '' }],
    });
  };

  const removeStep = (index: number) => {
    if (!editedDoc) return;
    setEditedDoc({
      ...editedDoc,
      steps: editedDoc.steps.filter((_, i) => i !== index),
    });
  };

  const updatePrerequisite = (index: number, value: string) => {
    if (!editedDoc) return;
    const newPrereqs = [...editedDoc.prerequisites];
    newPrereqs[index] = value;
    setEditedDoc({ ...editedDoc, prerequisites: newPrereqs });
  };

  const addPrerequisite = () => {
    if (!editedDoc) return;
    setEditedDoc({
      ...editedDoc,
      prerequisites: [...editedDoc.prerequisites, ''],
    });
  };

  const removePrerequisite = (index: number) => {
    if (!editedDoc) return;
    setEditedDoc({
      ...editedDoc,
      prerequisites: editedDoc.prerequisites.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Description */}
      <p className="text-sm text-[var(--text-muted)]">
        {operationDescriptions[operationType]}
      </p>

      {/* Document summary (for regenerate) */}
      {operationType === 'regenerate' && document && (
        <div className="bg-[var(--bg)] rounded-sm p-3 border border-[var(--border-muted)]">
          <div className="text-xs font-medium text-[var(--text-muted)] mb-2">
            Document:
          </div>
          <div className="text-sm text-[var(--text)]">
            <span className="font-medium">{document.title}</span>
            <span className="text-[var(--text-muted)]">
              {' '}
              ({document.steps.length} steps)
            </span>
          </div>
        </div>
      )}

      {/* Instructions input (for regenerate) */}
      {operationType === 'regenerate' && (
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">
            Instructions (optional)
          </label>
          <Input.TextArea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Optional: Provide guidance on what to improve (e.g., 'Add more detail to the troubleshooting section' or 'Simplify the steps')"
            rows={3}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Edit form */}
      {operationType === 'edit' && editedDoc && (
        <div className="flex flex-col gap-3 max-h-[60vh] overflow-auto">
          <div>
            <label className="block text-xs font-medium text-[var(--text)] mb-1">
              Title
            </label>
            <Input
              value={editedDoc.title}
              onChange={(e) => updateEditedDoc('title', e.target.value)}
              size="small"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text)] mb-1">
              Overview
            </label>
            <Input.TextArea
              value={editedDoc.overview}
              onChange={(e) => updateEditedDoc('overview', e.target.value)}
              rows={2}
              size="small"
            />
          </div>

          {/* Prerequisites */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[var(--text)]">
                Prerequisites
              </label>
              <button
                type="button"
                onClick={addPrerequisite}
                className="text-xs text-[var(--primary)] hover:underline"
              >
                + Add prerequisite
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {editedDoc.prerequisites.map((prereq, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={prereq}
                    onChange={(e) => updatePrerequisite(index, e.target.value)}
                    size="small"
                    className="flex-1"
                    placeholder="Prerequisite..."
                  />
                  <button
                    type="button"
                    onClick={() => removePrerequisite(index)}
                    className="text-xs text-[var(--danger)] hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[var(--text)]">Steps</label>
              <button
                type="button"
                onClick={addStep}
                className="text-xs text-[var(--primary)] hover:underline"
              >
                + Add step
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {editedDoc.steps.map((step, index) => (
                <div
                  key={index}
                  className="bg-[var(--bg)] p-3 rounded-sm border border-[var(--border-muted)]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[var(--text-muted)]">
                      Step {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="text-xs text-[var(--danger)] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Input
                      value={step.title}
                      onChange={(e) => updateStep(index, 'title', e.target.value)}
                      size="small"
                      placeholder="Step title..."
                    />
                    <Input.TextArea
                      value={step.description}
                      onChange={(e) => updateStep(index, 'description', e.target.value)}
                      rows={2}
                      size="small"
                      placeholder="Step description..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-sm text-[var(--danger)] bg-[color-mix(in_srgb,var(--danger)_10%,var(--bg))] p-3 rounded-sm">
          {error}
        </div>
      )}
    </div>
  );
}

function DocOperationModalInner({
  operationType,
  document,
  onConfirm,
  onCancel,
  isLoading = false,
  error = null,
}: Omit<DocOperationModalProps, 'open'>) {
  const [instructions, setInstructions] = useState('');
  const [editedDoc, setEditedDoc] = useState<UserDocument | null>(() =>
    operationType === 'edit' && document
      ? JSON.parse(JSON.stringify(document))
      : null
  );

  const handleConfirm = () => {
    if (operationType === 'edit' && editedDoc) {
      onConfirm(undefined, editedDoc);
    } else {
      onConfirm(instructions || undefined);
    }
  };

  return (
    <Modal
      open={true}
      onCancel={onCancel}
      onOk={handleConfirm}
      title={operationTitles[operationType]}
      okText={isLoading ? 'Processing...' : operationType === 'edit' ? 'Save' : 'Regenerate'}
      okButtonProps={{
        disabled: isLoading || (operationType === 'edit' && !editedDoc),
        loading: isLoading,
      }}
      cancelButtonProps={{ disabled: isLoading }}
      width={600}
    >
      <ModalContent
        operationType={operationType}
        document={document}
        isLoading={isLoading}
        error={error}
        instructions={instructions}
        setInstructions={setInstructions}
        editedDoc={editedDoc}
        setEditedDoc={setEditedDoc}
      />
    </Modal>
  );
}

export function DocOperationModal({ open, ...props }: DocOperationModalProps) {
  // Render inner component only when open, so it remounts and resets state each time
  if (!open) return null;
  return <DocOperationModalInner {...props} />;
}

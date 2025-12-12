/**
 * Document Operation Modal Component
 *
 * Modal for operations (Regenerate, Edit) with optional instructions.
 */

import { Input } from '~/core/components/ui';
import type { UserDocument, DocumentStep } from '../../lib/llm/types';
import {
  OperationModal,
  ArrayFieldCardEditor,
  type OperationModalConfig,
} from './OperationModal';

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

const DOC_MODAL_CONFIG: OperationModalConfig<UserDocument, DocOperationType> = {
  operations: {
    regenerate: {
      title: 'Regenerate Document',
      description:
        'Regenerate this document based on the original design documentation. The LLM will improve clarity and completeness.',
    },
    edit: {
      title: 'Edit Document',
      description: 'Manually edit the document fields below.',
    },
  },
  modalWidth: 600,
  showInstructionsFor: ['regenerate'],
  instructionPlaceholders: {
    regenerate:
      "Optional: Provide guidance on what to improve (e.g., 'Add more detail to the troubleshooting section' or 'Simplify the steps')",
  },
  renderSummary: (doc) => {
    const document = Array.isArray(doc) ? doc[0] : doc;
    return (
      <>
        <div className="text-xs font-medium text-[var(--text-muted)] mb-2">Document:</div>
        <div className="text-sm text-[var(--text)]">
          <span className="font-medium">{document.title}</span>
          <span className="text-[var(--text-muted)]"> ({document.steps.length} steps)</span>
        </div>
      </>
    );
  },
  renderEditForm: (doc, onChange) => <DocEditForm document={doc} onChange={onChange} />,
  getOkText: (operationType, isLoading) =>
    isLoading ? 'Processing...' : operationType === 'edit' ? 'Save' : 'Regenerate',
};

// ============================================================================
// Edit Form
// ============================================================================

interface DocEditFormProps {
  document: UserDocument;
  onChange: (updated: UserDocument) => void;
}

function DocEditForm({ document, onChange }: DocEditFormProps) {
  const updateField = <K extends keyof UserDocument>(field: K, value: UserDocument[K]) => {
    onChange({ ...document, [field]: value });
  };

  return (
    <>
      <div>
        <label className="block text-xs font-medium text-[var(--text)] mb-1">Title</label>
        <Input
          value={document.title}
          onChange={(e) => updateField('title', e.target.value)}
          size="small"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text)] mb-1">Overview</label>
        <Input.TextArea
          value={document.overview}
          onChange={(e) => updateField('overview', e.target.value)}
          rows={2}
          size="small"
        />
      </div>

      {/* Prerequisites */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-[var(--text)]">Prerequisites</label>
          <button
            type="button"
            onClick={() => updateField('prerequisites', [...document.prerequisites, ''])}
            className="text-xs text-[var(--primary)] hover:underline"
          >
            + Add prerequisite
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {document.prerequisites.map((prereq, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                value={prereq}
                onChange={(e) => {
                  const newPrereqs = [...document.prerequisites];
                  newPrereqs[index] = e.target.value;
                  updateField('prerequisites', newPrereqs);
                }}
                size="small"
                className="flex-1"
                placeholder="Prerequisite..."
              />
              <button
                type="button"
                onClick={() =>
                  updateField(
                    'prerequisites',
                    document.prerequisites.filter((_, i) => i !== index)
                  )
                }
                className="text-xs text-[var(--danger)] hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <ArrayFieldCardEditor<DocumentStep>
        items={document.steps}
        onChange={(steps) => updateField('steps', steps)}
        createItem={() => ({ title: '', description: '' })}
        label="Steps"
        addLabel="+ Add step"
        itemLabel="Step"
        renderItem={(step, _index, onItemChange) => (
          <div className="flex flex-col gap-2">
            <Input
              value={step.title}
              onChange={(e) => onItemChange({ ...step, title: e.target.value })}
              size="small"
              placeholder="Step title..."
            />
            <Input.TextArea
              value={step.description}
              onChange={(e) => onItemChange({ ...step, description: e.target.value })}
              rows={2}
              size="small"
              placeholder="Step description..."
            />
          </div>
        )}
      />
    </>
  );
}

// ============================================================================
// Main Export
// ============================================================================

export function DocOperationModal({
  open,
  operationType,
  document,
  onConfirm,
  onCancel,
  isLoading,
  error,
}: DocOperationModalProps) {
  return (
    <OperationModal<UserDocument, DocOperationType>
      open={open}
      operationType={operationType}
      entity={document}
      onConfirm={onConfirm}
      onCancel={onCancel}
      isLoading={isLoading}
      error={error}
      config={DOC_MODAL_CONFIG}
    />
  );
}

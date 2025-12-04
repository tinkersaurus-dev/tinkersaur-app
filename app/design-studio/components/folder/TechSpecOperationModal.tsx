/**
 * Technical Specification Operation Modal Component
 *
 * Modal for operations (Regenerate, Edit) on tech spec sections with optional instructions.
 */

import { useState } from 'react';
import { Modal, Input } from '~/core/components/ui';
import type { TechSpecSection, TechSpecSubsection } from '../../lib/llm/types';
import { TECH_SPEC_SECTION_LABELS } from '../../lib/llm/types';

export type TechSpecOperationType = 'regenerate' | 'edit';

export interface TechSpecOperationModalProps {
  open: boolean;
  operationType: TechSpecOperationType;
  section: TechSpecSection | null;
  onConfirm: (instructions?: string, editedSection?: TechSpecSection) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

const operationTitles: Record<TechSpecOperationType, string> = {
  regenerate: 'Regenerate Section',
  edit: 'Edit Section',
};

const operationDescriptions: Record<TechSpecOperationType, string> = {
  regenerate:
    'Regenerate this section based on the original design documentation. The LLM will improve technical depth and accuracy.',
  edit: 'Manually edit the section fields below.',
};

interface ModalContentProps {
  operationType: TechSpecOperationType;
  section: TechSpecSection | null;
  isLoading: boolean;
  error: string | null;
  instructions: string;
  setInstructions: (value: string) => void;
  editedSection: TechSpecSection | null;
  setEditedSection: (section: TechSpecSection | null) => void;
}

function ModalContent({
  operationType,
  section,
  isLoading,
  error,
  instructions,
  setInstructions,
  editedSection,
  setEditedSection,
}: ModalContentProps) {
  const updateEditedSection = <K extends keyof TechSpecSection>(
    field: K,
    value: TechSpecSection[K]
  ) => {
    if (!editedSection) return;
    setEditedSection({ ...editedSection, [field]: value });
  };

  const updateSubsection = (index: number, field: keyof TechSpecSubsection, value: string) => {
    if (!editedSection || !editedSection.subsections) return;
    const newSubsections = [...editedSection.subsections];
    newSubsections[index] = { ...newSubsections[index], [field]: value };
    setEditedSection({ ...editedSection, subsections: newSubsections });
  };

  const addSubsection = () => {
    if (!editedSection) return;
    setEditedSection({
      ...editedSection,
      subsections: [...(editedSection.subsections || []), { title: '', content: '' }],
    });
  };

  const removeSubsection = (index: number) => {
    if (!editedSection || !editedSection.subsections) return;
    setEditedSection({
      ...editedSection,
      subsections: editedSection.subsections.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Description */}
      <p className="text-sm text-[var(--text-muted)]">
        {operationDescriptions[operationType]}
      </p>

      {/* Section summary (for regenerate) */}
      {operationType === 'regenerate' && section && (
        <div className="bg-[var(--bg)] rounded-sm p-3 border border-[var(--border-muted)]">
          <div className="text-xs font-medium text-[var(--text-muted)] mb-2">
            Section:
          </div>
          <div className="text-sm text-[var(--text)]">
            <span className="font-medium">{section.title}</span>
            <span className="text-[var(--text-muted)]">
              {' '}
              ({TECH_SPEC_SECTION_LABELS[section.sectionType] || section.sectionType})
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
            placeholder="Optional: Provide guidance on what to improve (e.g., 'Add more code examples' or 'Include error handling details' or 'Focus on performance considerations')"
            rows={3}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Edit form */}
      {operationType === 'edit' && editedSection && (
        <div className="flex flex-col gap-3 max-h-[60vh] overflow-auto">
          <div>
            <label className="block text-xs font-medium text-[var(--text)] mb-1">
              Title
            </label>
            <Input
              value={editedSection.title}
              onChange={(e) => updateEditedSection('title', e.target.value)}
              size="small"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text)] mb-1">
              Content (Markdown)
            </label>
            <Input.TextArea
              value={editedSection.content}
              onChange={(e) => updateEditedSection('content', e.target.value)}
              rows={8}
              size="small"
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
          </div>

          {/* Subsections */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[var(--text)]">
                Subsections
              </label>
              <button
                type="button"
                onClick={addSubsection}
                className="text-xs text-[var(--primary)] hover:underline"
              >
                + Add subsection
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {(editedSection.subsections || []).map((subsection, index) => (
                <div
                  key={index}
                  className="bg-[var(--bg)] p-3 rounded-sm border border-[var(--border-muted)]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[var(--text-muted)]">
                      Subsection {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSubsection(index)}
                      className="text-xs text-[var(--danger)] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Input
                      value={subsection.title}
                      onChange={(e) => updateSubsection(index, 'title', e.target.value)}
                      size="small"
                      placeholder="Subsection title..."
                    />
                    <Input.TextArea
                      value={subsection.content}
                      onChange={(e) => updateSubsection(index, 'content', e.target.value)}
                      rows={4}
                      size="small"
                      style={{ fontFamily: 'monospace', fontSize: '11px' }}
                      placeholder="Subsection content (Markdown)..."
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

function TechSpecOperationModalInner({
  operationType,
  section,
  onConfirm,
  onCancel,
  isLoading = false,
  error = null,
}: Omit<TechSpecOperationModalProps, 'open'>) {
  const [instructions, setInstructions] = useState('');
  const [editedSection, setEditedSection] = useState<TechSpecSection | null>(() =>
    operationType === 'edit' && section
      ? JSON.parse(JSON.stringify(section))
      : null
  );

  const handleConfirm = () => {
    if (operationType === 'edit' && editedSection) {
      onConfirm(undefined, editedSection);
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
        disabled: isLoading || (operationType === 'edit' && !editedSection),
        loading: isLoading,
      }}
      cancelButtonProps={{ disabled: isLoading }}
      width={700}
    >
      <ModalContent
        operationType={operationType}
        section={section}
        isLoading={isLoading}
        error={error}
        instructions={instructions}
        setInstructions={setInstructions}
        editedSection={editedSection}
        setEditedSection={setEditedSection}
      />
    </Modal>
  );
}

export function TechSpecOperationModal({ open, ...props }: TechSpecOperationModalProps) {
  // Render inner component only when open, so it remounts and resets state each time
  if (!open) return null;
  return <TechSpecOperationModalInner {...props} />;
}

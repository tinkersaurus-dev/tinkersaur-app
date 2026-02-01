/**
 * Technical Specification Operation Modal Component
 *
 * Modal for operations (Regenerate, Edit) on tech spec sections with optional instructions.
 */

import { Input } from '@/shared/ui';
import type { TechSpecSection, TechSpecSubsection } from '@/features/llm-generation';
import { TECH_SPEC_SECTION_LABELS } from '@/features/llm-generation';
import {
  OperationModal,
  ArrayFieldCardEditor,
  type OperationModalConfig,
} from './OperationModal';

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

const TECH_SPEC_MODAL_CONFIG: OperationModalConfig<TechSpecSection, TechSpecOperationType> = {
  operations: {
    regenerate: {
      title: 'Regenerate Section',
      description:
        'Regenerate this section based on the original design documentation. The LLM will improve technical depth and accuracy.',
    },
    edit: {
      title: 'Edit Section',
      description: 'Manually edit the section fields below.',
    },
  },
  modalWidth: 700,
  showInstructionsFor: ['regenerate'],
  instructionPlaceholders: {
    regenerate:
      "Optional: Provide guidance on what to improve (e.g., 'Add more code examples' or 'Include error handling details' or 'Focus on performance considerations')",
  },
  renderSummary: (section) => {
    const sec = Array.isArray(section) ? section[0] : section;
    return (
      <>
        <div className="text-xs font-medium text-[var(--text-muted)] mb-2">Section:</div>
        <div className="text-sm text-[var(--text)]">
          <span className="font-medium">{sec.title}</span>
          <span className="text-[var(--text-muted)]">
            {' '}
            ({TECH_SPEC_SECTION_LABELS[sec.sectionType] || sec.sectionType})
          </span>
        </div>
      </>
    );
  },
  renderEditForm: (section, onChange) => (
    <TechSpecEditForm section={section} onChange={onChange} />
  ),
  getOkText: (operationType, isLoading) =>
    isLoading ? 'Processing...' : operationType === 'edit' ? 'Save' : 'Regenerate',
};

// ============================================================================
// Edit Form
// ============================================================================

interface TechSpecEditFormProps {
  section: TechSpecSection;
  onChange: (updated: TechSpecSection) => void;
}

function TechSpecEditForm({ section, onChange }: TechSpecEditFormProps) {
  const updateField = <K extends keyof TechSpecSection>(field: K, value: TechSpecSection[K]) => {
    onChange({ ...section, [field]: value });
  };

  return (
    <>
      <div>
        <label className="block text-xs font-medium text-[var(--text)] mb-1">Title</label>
        <Input
          value={section.title}
          onChange={(e) => updateField('title', e.target.value)}
          size="small"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text)] mb-1">
          Content (Markdown)
        </label>
        <Input.TextArea
          value={section.content}
          onChange={(e) => updateField('content', e.target.value)}
          rows={8}
          size="small"
          style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-base)' }}
        />
      </div>

      {/* Subsections */}
      <ArrayFieldCardEditor<TechSpecSubsection>
        items={section.subsections || []}
        onChange={(subsections) => updateField('subsections', subsections)}
        createItem={() => ({ title: '', content: '' })}
        label="Subsections"
        addLabel="+ Add subsection"
        itemLabel="Subsection"
        renderItem={(subsection, _index, onItemChange) => (
          <div className="flex flex-col gap-2">
            <Input
              value={subsection.title}
              onChange={(e) => onItemChange({ ...subsection, title: e.target.value })}
              size="small"
              placeholder="Subsection title..."
            />
            <Input.TextArea
              value={subsection.content}
              onChange={(e) => onItemChange({ ...subsection, content: e.target.value })}
              rows={4}
              size="small"
              style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-base)' }}
              placeholder="Subsection content (Markdown)..."
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

export function TechSpecOperationModal({
  open,
  operationType,
  section,
  onConfirm,
  onCancel,
  isLoading,
  error,
}: TechSpecOperationModalProps) {
  return (
    <OperationModal<TechSpecSection, TechSpecOperationType>
      open={open}
      operationType={operationType}
      entity={section}
      onConfirm={onConfirm}
      onCancel={onCancel}
      isLoading={isLoading}
      error={error}
      config={TECH_SPEC_MODAL_CONFIG}
    />
  );
}

/**
 * EditableSection Component
 * A Card-based section with toggle between view and edit modes
 */

import type { ReactNode } from 'react';
import { LuPencil, LuCheck, LuX, LuSparkles } from 'react-icons/lu';
import { Card } from '../Card';

export interface EditableSectionProps {
  /** Section title */
  title: string;
  /** Whether in edit mode */
  isEditing: boolean;
  /** Toggle edit mode */
  onEditToggle: () => void;
  /** Save handler - returns true if save succeeded */
  onSave: () => Promise<boolean> | boolean;
  /** Cancel handler */
  onCancel: () => void;
  /** Whether save is in progress */
  isSaving?: boolean;
  /** Whether there are validation errors */
  hasErrors?: boolean;
  /** Section content */
  children: ReactNode;
  /** Additional className */
  className?: string;
  /** Handler for generate button click */
  onGenerateClick?: () => void;
  /** Whether generation is in progress (disables button) */
  isGenerating?: boolean;
}

export function EditableSection({
  title,
  isEditing,
  onEditToggle,
  onSave,
  onCancel,
  isSaving = false,
  hasErrors = false,
  children,
  className = '',
  onGenerateClick,
  isGenerating = false,
}: EditableSectionProps) {
  // Base icon button styles
  const iconButtonBase = `
    flex items-center justify-center
    w-6 h-6
    rounded-sm
    transition-all
    cursor-pointer
  `.trim().replace(/\s+/g, ' ');

  // Edit button (default state)
  const editButtonClasses = `
    ${iconButtonBase}
    text-[var(--text-muted)]
    hover:text-[var(--text)]
    hover:bg-[var(--bg-dark)]
  `.trim().replace(/\s+/g, ' ');

  // Save button (green accent)
  const saveButtonClasses = `
    ${iconButtonBase}
    text-[var(--text-muted)]
    hover:text-[var(--success)]
    hover:bg-[var(--bg-dark)]
    ${isSaving || hasErrors ? 'opacity-50 cursor-not-allowed' : ''}
  `.trim().replace(/\s+/g, ' ');

  // Cancel button (red accent)
  const cancelButtonClasses = `
    ${iconButtonBase}
    text-[var(--text-muted)]
    hover:text-[var(--danger)]
    hover:bg-[var(--bg-dark)]
  `.trim().replace(/\s+/g, ' ');

  const handleSaveClick = async () => {
    if (isSaving || hasErrors) return;
    await onSave();
  };

  return (
    <Card className={className}>
      {/* Header with title and action buttons */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3>

        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <button
                type="button"
                className={saveButtonClasses}
                onClick={handleSaveClick}
                disabled={isSaving || hasErrors}
                title="Save"
              >
                {isSaving ? (
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LuCheck className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                className={cancelButtonClasses}
                onClick={onCancel}
                disabled={isSaving}
                title="Cancel"
              >
                <LuX className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              {onGenerateClick && (
                <button
                  type="button"
                  className={editButtonClasses}
                  onClick={onGenerateClick}
                  disabled={isGenerating}
                  title="Generate with AI"
                >
                  <LuSparkles className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                className={editButtonClasses}
                onClick={onEditToggle}
                title="Edit"
              >
                <LuPencil className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {children}
    </Card>
  );
}

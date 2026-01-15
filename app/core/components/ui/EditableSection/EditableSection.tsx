/**
 * EditableSection Component
 * A Card-based section with toggle between view and edit modes
 */

import type { ReactNode } from 'react';
import { LuPencil, LuCheck, LuX, LuSparkles } from 'react-icons/lu';
import { Card } from '../Card';
import { Button } from '../Button';

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
              <Button
                variant="text"
                size="small"
                onClick={handleSaveClick}
                disabled={isSaving || hasErrors}
                title="Save"
                icon={
                  isSaving ? (
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LuCheck className="w-4 h-4" />
                  )
                }
              />
              <Button
                variant="text"
                size="small"
                onClick={onCancel}
                disabled={isSaving}
                title="Cancel"
                icon={<LuX className="w-4 h-4" />}
              />
            </>
          ) : (
            <>
              {onGenerateClick && (
                <Button
                  variant="text"
                  size="small"
                  onClick={onGenerateClick}
                  disabled={isGenerating}
                  title="Generate with AI"
                  icon={<LuSparkles className="w-4 h-4" />}
                />
              )}
              <Button
                variant="text"
                size="small"
                onClick={onEditToggle}
                title="Edit"
                icon={<LuPencil className="w-4 h-4" />}
              />
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {children}
    </Card>
  );
}

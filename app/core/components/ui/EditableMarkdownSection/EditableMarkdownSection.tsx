/**
 * EditableMarkdownSection Component
 * Extends EditableSection to handle markdown content with view/edit modes
 */

import { useState, useCallback } from 'react';
import { EditableSection } from '../EditableSection';
import { MarkdownContent } from '../MarkdownContent';
import { Input } from '../Input';

// Import markdown styles
import '~/design-studio/styles/markdown-content.css';

export interface EditableMarkdownSectionProps {
  /** Section title */
  title: string;
  /** Markdown content */
  content: string;
  /** Save handler - returns true if successful */
  onSave: (content: string) => Promise<boolean>;
  /** Whether save is in progress */
  isSaving?: boolean;
  /** Placeholder text when empty */
  placeholder?: string;
  /** Minimum rows for textarea */
  minRows?: number;
  /** Additional className for the Card */
  className?: string;
  /** Handler for generate button click - receives current edit content */
  onGenerateClick?: (currentContent: string) => void;
  /** Whether generation is in progress */
  isGenerating?: boolean;
}

export function EditableMarkdownSection({
  title,
  content,
  onSave,
  isSaving = false,
  placeholder = 'Enter content...',
  minRows = 6,
  className = '',
  onGenerateClick,
  isGenerating = false,
}: EditableMarkdownSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  const handleEditToggle = useCallback(() => {
    setEditContent(content); // Reset to current content
    setIsEditing(true);
  }, [content]);

  const handleSave = useCallback(async () => {
    const success = await onSave(editContent);
    if (success) {
      setIsEditing(false);
    }
    return success;
  }, [editContent, onSave]);

  const handleCancel = useCallback(() => {
    setEditContent(content); // Reset changes
    setIsEditing(false);
  }, [content]);

  const handleGenerateClick = useCallback(() => {
    // Pass the current content (either saved or being edited) to the generate handler
    onGenerateClick?.(editContent || content);
  }, [onGenerateClick, editContent, content]);

  // Edit mode textarea styling - light yellow bg with orange border (matches EditableField)
  const editTextareaClasses = `
    bg-[var(--tag-bg-orange)]
    border-[var(--tag-orange)]
    hover:border-[var(--tag-orange)]
    focus:border-[var(--tag-orange)]
    focus:ring-[var(--tag-orange)]
  `.trim().replace(/\s+/g, ' ');

  return (
    <EditableSection
      title={title}
      isEditing={isEditing}
      onEditToggle={handleEditToggle}
      onSave={handleSave}
      onCancel={handleCancel}
      isSaving={isSaving}
      className={className}
      onGenerateClick={onGenerateClick ? handleGenerateClick : undefined}
      isGenerating={isGenerating}
    >
      {isEditing ? (
        <Input.TextArea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          placeholder={placeholder}
          rows={minRows}
          className={editTextareaClasses}
        />
      ) : (
        <div className="max-w-none">
          {content ? (
            <MarkdownContent content={content} className="markdown-content markdown-content--compact" />
          ) : (
            <p className="text-xs text-[var(--text-muted)] italic">
              Click the edit button to add {title.toLowerCase()} content.
            </p>
          )}
        </div>
      )}
    </EditableSection>
  );
}

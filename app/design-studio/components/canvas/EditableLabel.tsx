import { useRef, useEffect, type ChangeEvent, type KeyboardEvent } from 'react';
import './EditableLabel.css';

export interface EditableLabelProps {
  label: string | undefined;
  isEditing: boolean;
  onStartEdit: () => void;
  onLabelChange: (newLabel: string) => void;
  onFinishEdit: () => void;
  fontSize?: number;
  className?: string;
  style?: React.CSSProperties;
  editClasses?: string;
  displayClasses?: string;
}

export function EditableLabel({
  label,
  isEditing,
  onStartEdit,
  onLabelChange,
  onFinishEdit,
  fontSize = 12,
  className,
  style,
  editClasses,
  displayClasses,
}: EditableLabelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea to fit content
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Auto-focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      adjustTextareaHeight();
    }
  }, [isEditing]);

  // Adjust height when label changes
  useEffect(() => {
    if (isEditing) {
      adjustTextareaHeight();
    }
  }, [label, isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartEdit();
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onLabelChange(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Enter saves
      e.preventDefault();
      onFinishEdit();
    } else if (e.key === 'Escape') {
      // Escape saves
      e.preventDefault();
      onFinishEdit();
    }
    e.stopPropagation(); // Prevent canvas interaction during editing
  };

  const handleBlur = () => {
    onFinishEdit();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent shape dragging during edit
    e.stopPropagation();
  };

  // Structural styles for edit mode (non-visual, functional)
  const editStructuralStyle: React.CSSProperties = {
    resize: 'none',
    fontSize: `${fontSize}px`,
    fontFamily: 'inherit',
    textAlign: 'center',
    overflow: 'hidden',
    outline: 'none',
  };

  // Structural styles for display mode (non-visual, functional)
  const displayStructuralStyle: React.CSSProperties = {
    fontSize: `${fontSize}px`,
    textAlign: 'center',
    overflow: 'hidden',
    height: '100%',
    display: '-webkit-box',
    WebkitLineClamp: 4,
    WebkitBoxOrient: 'vertical',
  };

  // Merge structural styles with custom style prop
  const editStyle: React.CSSProperties = { ...editStructuralStyle, ...style };
  const displayStyle: React.CSSProperties = { ...displayStructuralStyle, ...style };

  // Use custom classes or default classes
  const editClassName = editClasses || 'editable-label-edit-default';
  const displayClassName = displayClasses || 'editable-label-display-default';

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {isEditing ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--canvas-label-editing-fill)',
            position: 'relative',
            zIndex: 1000,
          }}
        >
          <textarea
            ref={textareaRef}
            value={label || ''}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onMouseDown={handleMouseDown}
            rows={1}
            className={editClassName}
            style={editStyle}
          />
        </div>
      ) : (
        <div
          className={displayClassName}
          style={displayStyle}
        >
          {label || ''}
        </div>
      )}
    </div>
  );
}

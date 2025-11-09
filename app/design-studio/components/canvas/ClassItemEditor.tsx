import { useRef, useEffect, type ChangeEvent, type KeyboardEvent } from 'react';
import './ClassItemEditor.css';

export interface ClassItemEditorProps {
  value: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onChange: (newValue: string) => void;
  onFinishEdit: () => void;
  onDelete: () => void;
  fontSize?: number;
  showDelete?: boolean;
  zoom?: number;
}

export function ClassItemEditor({
  value,
  isEditing,
  onStartEdit,
  onChange,
  onFinishEdit,
  onDelete,
  fontSize = 11,
  showDelete = false,
  zoom = 1,
}: ClassItemEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartEdit();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onFinishEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onFinishEdit();
    }
    e.stopPropagation();
  };

  const handleBlur = () => {
    onFinishEdit();
  };

  const handleDeleteClick = () => {
    onDelete();
  };

  return (
    <div
      data-interactive="true"
      className="class-item-editor"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: `${4 / zoom}px`,
        padding: `${2 / zoom}px ${4 / zoom}px`,
        position: 'relative',
      }}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="class-item-input"
          style={{
            fontSize: `${fontSize / zoom}px`,
            width: '100%',
            border: `${1 / zoom}px solid var(--canvas-label-editing-border, #ddd)`,
            borderRadius: `${2 / zoom}px`,
            padding: `${2 / zoom}px ${4 / zoom}px`,
            outline: 'none',
            background: 'var(--canvas-label-editing-fill, #fff)',
          }}
        />
      ) : (
        <>
          <span
            className="class-item-text"
            style={{
              fontSize: `${fontSize / zoom}px`,
              flex: 1,
              textAlign: 'left',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {value || '(empty)'}
          </span>
          {showDelete && (
            <button
              className="class-item-delete"
              onClick={handleDeleteClick}
              style={{
                fontSize: `${10 / zoom}px`,
                width: `${16 / zoom}px`,
                height: `${16 / zoom}px`,
                padding: 0,
                border: `${1 / zoom}px solid var(--canvas-label-editing-border, #ddd)`,
                borderRadius: `${2 / zoom}px`,
                background: 'var(--canvas-label-editing-fill, #fff)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              title="Delete"
            >
              ×
            </button>
          )}
        </>
      )}
    </div>
  );
}

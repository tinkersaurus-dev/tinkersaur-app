import { useRef, useEffect, type ChangeEvent, type KeyboardEvent } from 'react';
import './ClassItemEditor.css';
import { LuTrash2 } from "react-icons/lu";

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
        padding: `4px 8px`,
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
            fontSize: fontSize,
            width: '100%',
            border: `${1 / zoom}px solid var(--canvas-label-editing-border)`,
            borderRadius: `${2 / zoom}px`,
            padding: `4px 8px`,
            outline: 'none',
            background: 'var(--canvas-label-editing-fill)',
          }}
        />
      ) : (
        <>
          <span
            className="class-item-text"
            style={{
              fontSize: fontSize,
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
                fontSize: `10px`,
                padding: 0,
                borderRadius: `${2 / zoom}px`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: 'var(--danger)',
              }}
              title="Delete"
            >
              <LuTrash2 />
            </button>
          )}
        </>
      )}
    </div>
  );
}

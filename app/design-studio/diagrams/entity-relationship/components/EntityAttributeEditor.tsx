import { useRef, useEffect, type ChangeEvent, type KeyboardEvent } from 'react';
import { LuTrash2 } from 'react-icons/lu';
import type { EntityAttributeData } from '~/core/entities/design-studio/types/Shape';
import './EntityAttributeEditor.css';

export interface EntityAttributeEditorProps {
  attribute: EntityAttributeData;
  isEditing: boolean;
  onStartEdit: () => void;
  onChange: (newAttribute: EntityAttributeData) => void;
  onFinishEdit: () => void;
  onDelete: () => void;
  fontSize?: number;
  showDelete?: boolean;
  zoom?: number;
}

/**
 * Format an entity attribute for display
 * Format: [KEY] type name "comment"
 * Examples: "PK int id", "string name", "FK uuid customer_id \"Foreign key to customer\""
 */
function formatAttribute(attr: EntityAttributeData): string {
  const parts: string[] = [];
  if (attr.key) {
    parts.push(attr.key);
  }
  parts.push(attr.type);
  parts.push(attr.name);
  if (attr.comment) {
    parts.push(`"${attr.comment}"`);
  }
  return parts.join(' ');
}

/**
 * Parse a formatted attribute string back into EntityAttributeData
 * Handles formats like:
 * - "PK int id" (display format with key at start)
 * - "int id PK" (Mermaid format with key at end)
 * - "string name"
 * - "FK uuid customer_id \"comment\""
 */
function parseAttribute(text: string): EntityAttributeData {
  const trimmed = text.trim();

  // Default values
  let key: 'PK' | 'FK' | 'UK' | undefined = undefined;
  let type = 'string';
  let name = 'attribute';
  let comment: string | undefined = undefined;

  // Extract comment if present (anything in quotes at the end)
  const commentMatch = trimmed.match(/^(.*?)\s*"([^"]*)"$/);
  let remaining = trimmed;
  if (commentMatch) {
    remaining = commentMatch[1].trim();
    comment = commentMatch[2];
  }

  // Split the remaining parts
  const parts = remaining.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { type, name };
  }

  // Check if first part is a key marker (display format: "PK int id")
  const firstPart = parts[0].toUpperCase();
  if (firstPart === 'PK' || firstPart === 'FK' || firstPart === 'UK') {
    key = firstPart as 'PK' | 'FK' | 'UK';
    parts.shift();
  }

  // Check if last part is a key marker (Mermaid format: "int id PK")
  if (!key && parts.length >= 1) {
    const lastPart = parts[parts.length - 1].toUpperCase();
    if (lastPart === 'PK' || lastPart === 'FK' || lastPart === 'UK') {
      key = lastPart as 'PK' | 'FK' | 'UK';
      parts.pop();
    }
  }

  // First remaining part is type (if present)
  if (parts.length >= 1) {
    type = parts[0];
    parts.shift();
  }

  // Remaining parts form the name (join with underscore if multiple words)
  if (parts.length >= 1) {
    name = parts.join('_');
  }

  return { type, name, key, comment };
}

export function EntityAttributeEditor({
  attribute,
  isEditing,
  onStartEdit,
  onChange,
  onFinishEdit,
  onDelete,
  fontSize = 11,
  showDelete = false,
  zoom = 1,
}: EntityAttributeEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const displayValue = formatAttribute(attribute);

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
    const parsed = parseAttribute(e.target.value);
    onChange(parsed);
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

  // Format key badge color
  const getKeyBadgeStyle = (keyType: 'PK' | 'FK' | 'UK' | undefined) => {
    switch (keyType) {
      case 'PK':
        return { backgroundColor: 'var(--primary)', color: 'white' };
      case 'FK':
        return { backgroundColor: 'var(--secondary)', color: 'white' };
      case 'UK':
        return { backgroundColor: 'var(--warning)', color: 'black' };
      default:
        return {};
    }
  };

  return (
    <div
      data-interactive="true"
      className="entity-attribute-editor"
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
          defaultValue={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="entity-attribute-input"
          style={{
            fontSize: fontSize,
            width: '100%',
            border: `${1 / zoom}px solid var(--canvas-label-editing-border, #ddd)`,
            borderRadius: `${2 / zoom}px`,
            padding: `4px 8px`,
            outline: 'none',
            background: 'var(--canvas-label-editing-fill, #fff)',
          }}
          placeholder="PK int id"
        />
      ) : (
        <>
          <span
            className="entity-attribute-text"
            style={{
              fontSize: fontSize,
              flex: 1,
              textAlign: 'left',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {attribute.key && (
              <span
                className="entity-attribute-key"
                style={{
                  ...getKeyBadgeStyle(attribute.key),
                  fontSize: fontSize * 0.8,
                  padding: '1px 4px',
                  borderRadius: '2px',
                  fontWeight: 'bold',
                }}
              >
                {attribute.key}
              </span>
            )}
            <span style={{ color: 'var(--text-muted)' }}>{attribute.type}</span>
            <span>{attribute.name}</span>
            {attribute.comment && (
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                "{attribute.comment}"
              </span>
            )}
          </span>
          {showDelete && (
            <button
              className="entity-attribute-delete"
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

/**
 * EditableField Component
 * A field that switches between display and edit modes
 */

import { Input } from '../Input';

export interface EditableFieldProps {
  /** Field label */
  label: string;
  /** Current value */
  value: string | undefined;
  /** Whether in edit mode */
  isEditing: boolean;
  /** Value change handler */
  onChange: (value: string) => void;
  /** Whether field is required */
  required?: boolean;
  /** Validation error message */
  error?: string;
  /** Input placeholder */
  placeholder?: string;
  /** Field type */
  type?: 'text' | 'textarea';
  /** Textarea rows */
  rows?: number;
  /** Max character length */
  maxLength?: number;
  /** Additional className */
  className?: string;
}

export function EditableField({
  label,
  value,
  isEditing,
  onChange,
  required = false,
  error,
  placeholder,
  type = 'text',
  rows = 4,
  maxLength,
  className = '',
}: EditableFieldProps) {
  // Edit mode field styling - light yellow bg with orange border
  const editFieldClasses = `
    bg-[var(--tag-bg-orange)]
    border-[var(--tag-orange)]
    hover:border-[var(--tag-orange)]
    focus:border-[var(--tag-orange)]
    focus:ring-[var(--tag-orange)]
  `.trim().replace(/\s+/g, ' ');

  if (isEditing) {
    const InputComponent = type === 'textarea' ? Input.TextArea : Input;

    return (
      <div className={`mb-4 ${className}`}>
        <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
          {label}
          {required && <span className="text-[var(--danger)] ml-1">*</span>}
        </label>
        <InputComponent
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={type === 'textarea' ? rows : undefined}
          className={editFieldClasses}
          error={!!error}
          size="small"
        />
        {error && (
          <div className="text-[var(--danger)] text-sm mt-1">{error}</div>
        )}
      </div>
    );
  }

  // Display mode - only render if value exists
  if (!value) return null;

  return (
    <div className={`mb-4 ${className}`}>
      <label className="text-xs font-medium text-[var(--text-muted)]">{label}</label>
      <p className="text-sm text-[var(--text)] whitespace-pre-wrap">{value}</p>
    </div>
  );
}

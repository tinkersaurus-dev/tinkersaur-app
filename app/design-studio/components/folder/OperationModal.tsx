/**
 * Generic Operation Modal Component
 *
 * A reusable modal for entity operations (Regenerate, Edit, Combine, Split, etc.)
 * with optional instructions input and customizable edit forms.
 */

import { useState, type ReactNode } from 'react';
import { Modal, Input } from '~/core/components/ui';

// ============================================================================
// Types
// ============================================================================

export interface OperationConfig {
  title: string;
  description: string;
}

export interface OperationModalConfig<T, Op extends string> {
  /** Operation metadata (titles and descriptions) */
  operations: Record<Op, OperationConfig>;

  /** Modal width in pixels (default: 600) */
  modalWidth?: number;

  /** Which operations show the instructions input */
  showInstructionsFor: Op[];

  /** Custom placeholder text for each operation's instructions */
  instructionPlaceholders?: Partial<Record<Op, string>>;

  /** Render a summary of the entity (shown for non-edit operations) */
  renderSummary: (entity: T | T[]) => ReactNode;

  /** Render the edit form (required if 'edit' is in operations) */
  renderEditForm?: (entity: T, onChange: (updated: T) => void) => ReactNode;

  /** Customize the OK button text (default: 'Confirm' or 'Save' for edit) */
  getOkText?: (operationType: Op, isLoading: boolean) => string;

  /** Customize the modal title (e.g., add count for multiple items) */
  getTitle?: (operationType: Op, entity: T | T[]) => string;
}

export interface OperationModalProps<T, Op extends string> {
  open: boolean;
  operationType: Op;
  entity: T | T[] | null;
  onConfirm: (instructions?: string, editedEntity?: T) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
  config: OperationModalConfig<T, Op>;
}

// ============================================================================
// Helper Components
// ============================================================================

interface ArrayFieldEditorProps<Item> {
  items: Item[];
  onChange: (items: Item[]) => void;
  renderItem: (item: Item, index: number, onChange: (updated: Item) => void) => ReactNode;
  createItem: () => Item;
  label: string;
  addLabel: string;
  itemLabel?: string;
  showItemIndex?: boolean;
  /** Extract a stable key from an item. Defaults to index if not provided. */
  getKey?: (item: Item, index: number) => string;
}

export function ArrayFieldEditor<Item>({
  items,
  onChange,
  renderItem,
  createItem,
  label,
  addLabel,
  itemLabel,
  showItemIndex = true,
  getKey,
}: ArrayFieldEditorProps<Item>) {
  const handleAdd = () => {
    onChange([...items, createItem()]);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, updated: Item) => {
    const newItems = [...items];
    newItems[index] = updated;
    onChange(newItems);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-[var(--text)]">{label}</label>
        <button
          type="button"
          onClick={handleAdd}
          className="text-xs text-[var(--primary)] hover:underline"
        >
          {addLabel}
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item, index) => (
          <div key={getKey ? getKey(item, index) : `item-${index}`} className="flex gap-2 items-start">
            {showItemIndex && itemLabel && (
              <span className="text-xs text-[var(--text-muted)] pt-2 min-w-[20px]">
                {index + 1}.
              </span>
            )}
            <div className="flex-1">
              {renderItem(item, index, (updated) => handleItemChange(index, updated))}
            </div>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="text-xs text-[var(--danger)] hover:underline pt-2"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Variant for complex items with a card wrapper
interface ArrayFieldCardEditorProps<Item> {
  items: Item[];
  onChange: (items: Item[]) => void;
  renderItem: (item: Item, index: number, onChange: (updated: Item) => void) => ReactNode;
  createItem: () => Item;
  label: string;
  addLabel: string;
  itemLabel: string;
  /** Extract a stable key from an item. Defaults to index if not provided. */
  getKey?: (item: Item, index: number) => string;
}

export function ArrayFieldCardEditor<Item>({
  items,
  onChange,
  renderItem,
  createItem,
  label,
  addLabel,
  itemLabel,
  getKey,
}: ArrayFieldCardEditorProps<Item>) {
  const handleAdd = () => {
    onChange([...items, createItem()]);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, updated: Item) => {
    const newItems = [...items];
    newItems[index] = updated;
    onChange(newItems);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-[var(--text)]">{label}</label>
        <button
          type="button"
          onClick={handleAdd}
          className="text-xs text-[var(--primary)] hover:underline"
        >
          {addLabel}
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {items.map((item, index) => (
          <div
            key={getKey ? getKey(item, index) : `item-${index}`}
            className="bg-[var(--bg)] p-3 rounded-sm border border-[var(--border-muted)]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-muted)]">
                {itemLabel} {index + 1}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-xs text-[var(--danger)] hover:underline"
              >
                Remove
              </button>
            </div>
            {renderItem(item, index, (updated) => handleItemChange(index, updated))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Modal Content
// ============================================================================

interface ModalContentProps<T, Op extends string> {
  operationType: Op;
  entity: T | T[] | null;
  config: OperationModalConfig<T, Op>;
  isLoading: boolean;
  error: string | null;
  instructions: string;
  setInstructions: (value: string) => void;
  editedEntity: T | null;
  setEditedEntity: (entity: T | null) => void;
}

function ModalContent<T, Op extends string>({
  operationType,
  entity,
  config,
  isLoading,
  error,
  instructions,
  setInstructions,
  editedEntity,
  setEditedEntity,
}: ModalContentProps<T, Op>) {
  const showInstructions = config.showInstructionsFor.includes(operationType);
  const isEditOperation = operationType === 'edit';
  const placeholder = config.instructionPlaceholders?.[operationType] ?? '';

  return (
    <div className="flex flex-col gap-4">
      {/* Description */}
      <p className="text-sm text-[var(--text-muted)]">
        {config.operations[operationType].description}
      </p>

      {/* Entity summary (for non-edit operations) */}
      {!isEditOperation && entity && (
        <div className="bg-[var(--bg)] rounded-sm p-3 border border-[var(--border-muted)]">
          {config.renderSummary(entity)}
        </div>
      )}

      {/* Instructions input */}
      {showInstructions && (
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">
            Instructions (optional)
          </label>
          <Input.TextArea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={placeholder}
            rows={3}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Edit form */}
      {isEditOperation && editedEntity && config.renderEditForm && (
        <div className="flex flex-col gap-3 max-h-[60vh] overflow-auto">
          {config.renderEditForm(editedEntity, (updated) => setEditedEntity(updated))}
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

// ============================================================================
// Inner Modal (with state)
// ============================================================================

function OperationModalInner<T, Op extends string>({
  operationType,
  entity,
  onConfirm,
  onCancel,
  isLoading = false,
  error = null,
  config,
}: Omit<OperationModalProps<T, Op>, 'open'>) {
  const [instructions, setInstructions] = useState('');
  const [editedEntity, setEditedEntity] = useState<T | null>(() => {
    if (operationType !== 'edit' || !entity) return null;
    // For edit operations, clone the entity (handle both single and array)
    const entityToEdit = Array.isArray(entity) ? entity[0] : entity;
    return entityToEdit ? JSON.parse(JSON.stringify(entityToEdit)) : null;
  });

  const handleConfirm = () => {
    if (operationType === 'edit' && editedEntity) {
      onConfirm(undefined, editedEntity);
    } else {
      onConfirm(instructions || undefined);
    }
  };

  const isEditOperation = operationType === 'edit';
  const title = config.getTitle
    ? config.getTitle(operationType, entity!)
    : config.operations[operationType].title;

  const okText = config.getOkText
    ? config.getOkText(operationType, isLoading)
    : isLoading
      ? 'Processing...'
      : isEditOperation
        ? 'Save'
        : 'Confirm';

  return (
    <Modal
      open={true}
      onCancel={onCancel}
      onOk={handleConfirm}
      title={title}
      okText={okText}
      okButtonProps={{
        disabled: isLoading || (isEditOperation && !editedEntity),
        loading: isLoading,
      }}
      cancelButtonProps={{ disabled: isLoading }}
      width={config.modalWidth ?? 600}
    >
      <ModalContent
        operationType={operationType}
        entity={entity}
        config={config}
        isLoading={isLoading}
        error={error}
        instructions={instructions}
        setInstructions={setInstructions}
        editedEntity={editedEntity}
        setEditedEntity={setEditedEntity}
      />
    </Modal>
  );
}

// ============================================================================
// Main Export
// ============================================================================

export function OperationModal<T, Op extends string>({
  open,
  ...props
}: OperationModalProps<T, Op>) {
  // Render inner component only when open, so it remounts and resets state each time
  if (!open) return null;
  return <OperationModalInner {...props} />;
}

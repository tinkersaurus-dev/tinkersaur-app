/**
 * Generic List Panel Component
 *
 * A reusable panel layout with sidebar navigation, main content area,
 * toolbar with common actions, and operation modal. Used by TechSpecPanel
 * and UserDocsPanel.
 */

import { type ReactNode } from 'react';
import { LuTrash2, LuRefreshCw, LuPencil, LuCopy } from 'react-icons/lu';
import { Button } from '@/shared/ui/Button';
import { useListPanel, type ListPanelOperationType } from './useListPanel';

export interface ListPanelModalProps<T> {
  open: boolean;
  operationType: ListPanelOperationType;
  item: T | null;
  onConfirm: (instructions?: string, editedItem?: T) => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
}

export interface ListPanelProps<T extends { id: string }> {
  initialItems: T[];
  folderContent: string;
  onItemsChange?: (items: T[]) => void;
  // Render props
  renderSidebar: (props: {
    items: T[];
    selectedId: string | null;
    onSelect: (id: string) => void;
  }) => ReactNode;
  renderCard: (item: T) => ReactNode;
  renderModal: (props: ListPanelModalProps<T>) => ReactNode;
  // Config
  emptyMessage: string;
  noSelectionMessage: string;
  toMarkdown: (item: T) => string;
  regenerate: (item: T, context: string, instructions?: string) => Promise<T>;
}

export function ListPanel<T extends { id: string }>({
  initialItems,
  folderContent,
  onItemsChange,
  renderSidebar,
  renderCard,
  renderModal,
  emptyMessage,
  noSelectionMessage,
  toMarkdown,
  regenerate,
}: ListPanelProps<T>) {
  const {
    items,
    selectedId,
    selectedItem,
    setSelectedId,
    handleDelete,
    handleCopy,
    modalOpen,
    operationType,
    isOperating,
    operationError,
    openOperationModal,
    handleOperation,
    closeModal,
  } = useListPanel<T>({
    initialItems,
    folderContent,
    onItemsChange,
    toMarkdown,
    regenerate,
  });

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      {renderSidebar({
        items,
        selectedId,
        onSelect: setSelectedId,
      })}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        {selectedItem && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)]">
            <Button
              variant="default"
              size="small"
              icon={<LuRefreshCw />}
              onClick={() => openOperationModal('regenerate')}
              title="Regenerate"
            >
              Regenerate
            </Button>
            <Button
              variant="default"
              size="small"
              icon={<LuPencil />}
              onClick={() => openOperationModal('edit')}
              title="Edit"
            >
              Edit
            </Button>
            <Button
              variant="default"
              size="small"
              icon={<LuTrash2 />}
              onClick={handleDelete}
              title="Delete"
            >
              Delete
            </Button>
            <Button
              variant="default"
              size="small"
              icon={<LuCopy />}
              onClick={handleCopy}
              className="ml-auto"
              title="Copy to clipboard"
            >
              Copy
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {selectedItem ? (
            renderCard(selectedItem)
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
              {noSelectionMessage}
            </div>
          )}
        </div>
      </div>

      {/* Operation Modal */}
      {renderModal({
        open: modalOpen,
        operationType,
        item: selectedItem,
        onConfirm: handleOperation,
        onCancel: closeModal,
        isLoading: isOperating,
        error: operationError,
      })}
    </div>
  );
}

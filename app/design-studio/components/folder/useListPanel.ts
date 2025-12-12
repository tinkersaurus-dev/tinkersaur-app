/**
 * Generic List Panel Hook
 *
 * Extracts common state management and handlers for list panel components
 * that display items in a sidebar with a main content area.
 */

import { useState, useCallback, useEffect } from 'react';

export type ListPanelOperationType = 'edit' | 'regenerate';

export interface UseListPanelOptions<T extends { id: string }> {
  initialItems: T[];
  folderContent: string;
  onItemsChange?: (items: T[]) => void;
  toMarkdown: (item: T) => string;
  regenerate: (item: T, context: string, instructions?: string) => Promise<T>;
}

export interface UseListPanelReturn<T extends { id: string }> {
  // Item state
  items: T[];
  selectedId: string | null;
  selectedItem: T | null;
  setSelectedId: (id: string | null) => void;
  updateItems: (items: T[]) => void;
  // Actions
  handleDelete: () => void;
  handleCopy: () => Promise<void>;
  // Modal state
  modalOpen: boolean;
  operationType: ListPanelOperationType;
  isOperating: boolean;
  operationError: string | null;
  openOperationModal: (type: ListPanelOperationType) => void;
  handleOperation: (instructions?: string, editedItem?: T) => Promise<void>;
  closeModal: () => void;
}

export function useListPanel<T extends { id: string }>({
  initialItems,
  folderContent,
  onItemsChange,
  toMarkdown,
  regenerate,
}: UseListPanelOptions<T>): UseListPanelReturn<T> {
  const [items, setItems] = useState<T[]>(initialItems);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialItems.length > 0 ? initialItems[0].id : null
  );

  // Sync when initialItems changes
  useEffect(() => {
    setItems(initialItems);
    setSelectedId(initialItems.length > 0 ? initialItems[0].id : null);
  }, [initialItems]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [operationType, setOperationType] = useState<ListPanelOperationType>('regenerate');
  const [isOperating, setIsOperating] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  const selectedItem = items.find((item) => item.id === selectedId) || null;

  const updateItems = useCallback(
    (newItems: T[]) => {
      setItems(newItems);
      onItemsChange?.(newItems);
    },
    [onItemsChange]
  );

  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    const newItems = items.filter((item) => item.id !== selectedId);
    const deletedIndex = items.findIndex((item) => item.id === selectedId);
    const newSelectedId =
      newItems.length > 0
        ? newItems[Math.min(deletedIndex, newItems.length - 1)].id
        : null;
    updateItems(newItems);
    setSelectedId(newSelectedId);
  }, [items, selectedId, updateItems]);

  const handleCopy = useCallback(async () => {
    if (!selectedItem) return;
    const markdown = toMarkdown(selectedItem);
    await navigator.clipboard.writeText(markdown);
  }, [selectedItem, toMarkdown]);

  const openOperationModal = useCallback((type: ListPanelOperationType) => {
    setOperationType(type);
    setOperationError(null);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleOperation = useCallback(
    async (instructions?: string, editedItem?: T) => {
      setIsOperating(true);
      setOperationError(null);

      try {
        if (operationType === 'edit' && editedItem) {
          // Local edit - no LLM call
          const newItems = items.map((item) =>
            item.id === editedItem.id ? editedItem : item
          );
          updateItems(newItems);
          setModalOpen(false);
        } else if (operationType === 'regenerate' && selectedItem) {
          const regeneratedItem = await regenerate(
            selectedItem,
            folderContent,
            instructions
          );
          const newItems = items.map((item) =>
            item.id === selectedItem.id ? regeneratedItem : item
          );
          updateItems(newItems);
          setModalOpen(false);
        }
      } catch (error) {
        setOperationError(
          error instanceof Error ? error.message : 'Operation failed'
        );
      } finally {
        setIsOperating(false);
      }
    },
    [operationType, selectedItem, items, folderContent, updateItems, regenerate]
  );

  return {
    items,
    selectedId,
    selectedItem,
    setSelectedId,
    updateItems,
    handleDelete,
    handleCopy,
    modalOpen,
    operationType,
    isOperating,
    operationError,
    openOperationModal,
    handleOperation,
    closeModal,
  };
}

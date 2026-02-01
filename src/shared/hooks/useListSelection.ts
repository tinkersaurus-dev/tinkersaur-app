import { useState, useCallback, useMemo } from 'react';

interface UseListSelectionOptions<T> {
  items: T[];
  getItemId: (item: T) => string;
}

interface UseListSelectionReturn<T> {
  selectedIds: Set<string>;
  selectedItems: T[];
  isSelected: (id: string) => boolean;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  toggle: (id: string) => void;
  toggleAll: () => void;
  select: (id: string) => void;
  deselect: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  clear: () => void;
}

/**
 * Hook for managing multi-select state in lists
 */
export function useListSelection<T>({
  items,
  getItemId,
}: UseListSelectionOptions<T>): UseListSelectionReturn<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(getItemId(item))),
    [items, selectedIds, getItemId]
  );

  const isAllSelected = useMemo(
    () => items.length > 0 && items.every((item) => selectedIds.has(getItemId(item))),
    [items, selectedIds, getItemId]
  );

  const isIndeterminate = useMemo(
    () => selectedIds.size > 0 && !isAllSelected,
    [selectedIds.size, isAllSelected]
  );

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(getItemId)));
    }
  }, [isAllSelected, items, getItemId]);

  const select = useCallback((id: string) => {
    setSelectedIds((prev) => new Set(prev).add(id));
  }, []);

  const deselect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(getItemId)));
  }, [items, getItemId]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    selectedIds,
    selectedItems,
    isSelected,
    isAllSelected,
    isIndeterminate,
    toggle,
    toggleAll,
    select,
    deselect,
    selectAll,
    deselectAll,
    clear,
  };
}

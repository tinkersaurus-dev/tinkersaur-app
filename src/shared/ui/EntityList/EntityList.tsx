import { useMemo, useCallback, useEffect } from 'react';
import { Table } from '../Table';
import type { TableColumn } from '../Table';
import { Empty } from '../Empty';
import { Checkbox } from '../Checkbox';
import { ListControlPanel } from '../ListControlPanel';
import { useListSelection } from '../../hooks';
import type { EntityListProps, SelectionState } from './types';

/**
 * Reusable entity list component with search, filters, pagination, and selection.
 *
 * Encapsulates the common pattern of ListControlPanel + Table with:
 * - Automatic selection column with select-all checkbox
 * - Multi-select filter URL parsing (comma-separated)
 * - Page change handling with selection clearing
 * - Server-side sorting and pagination
 */
export function EntityList<T extends { id: string }>({
  items,
  loading,
  totalCount,
  urlState,
  columns,
  filters = [],
  multiSelectFilterKeys = [],
  actions,
  onSelectionChange,
  searchPlaceholder = 'Search...',
  emptyState,
  emptyDescription = 'No items found.',
  rowKey = 'id',
  selectable = true,
}: EntityListProps<T>) {
  // Internal selection hook
  const selection = useListSelection({
    items,
    getItemId: (item) => item.id,
  });

  // Create stable selection state object for consumers
  const selectionState: SelectionState<T> = useMemo(
    () => ({
      selectedIds: selection.selectedIds,
      selectedItems: selection.selectedItems,
      selectedCount: selection.selectedIds.size,
      isAllSelected: selection.isAllSelected,
      isIndeterminate: selection.isIndeterminate,
      isSelected: selection.isSelected,
      toggle: selection.toggle,
      clear: selection.clear,
    }),
    [selection]
  );

  // Notify parent of selection changes
  useEffect(() => {
    onSelectionChange?.(selectionState);
  }, [selectionState, onSelectionChange]);

  // Parse multi-select filter values from URL (comma-separated to array)
  const filterValues = useMemo(() => {
    const values: Record<string, string | string[]> = { ...urlState.filters };

    multiSelectFilterKeys.forEach((key) => {
      const urlValue = urlState.filters[key];
      if (urlValue) {
        values[key] = urlValue.split(',').filter(Boolean);
      } else {
        values[key] = [];
      }
    });

    return values;
  }, [urlState.filters, multiSelectFilterKeys]);

  // Handle filter change with multi-select support
  const handleFilterChange = useCallback(
    (key: string, value: string | string[]) => {
      if (Array.isArray(value)) {
        // Convert array to comma-separated string for URL storage
        urlState.setFilter(key, value.join(','));
      } else {
        urlState.setFilter(key, value);
      }
    },
    [urlState]
  );

  // Handle page change with selection clearing
  const handlePageChange = useCallback(
    (page: number, pageSize: number) => {
      urlState.setPageChange(page, pageSize);
      selection.clear();
    },
    [urlState, selection]
  );

  // Prepend selection column if selectable
  const columnsWithSelection = useMemo(() => {
    if (!selectable) return columns;

    const selectionColumn: TableColumn<T> = {
      key: 'selection',
      title: (
        <Checkbox
          checked={selection.isAllSelected}
          indeterminate={selection.isIndeterminate}
          onChange={selection.toggleAll}
        />
      ),
      width: 48,
      render: (_, record) => (
        <Checkbox
          checked={selection.isSelected(record.id)}
          onChange={() => selection.toggle(record.id)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    };

    return [selectionColumn, ...columns];
  }, [columns, selectable, selection]);

  return (
    <>
      <ListControlPanel
        searchValue={urlState.search}
        onSearchChange={urlState.setSearch}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        selectedCount={selectable ? selection.selectedIds.size : 0}
        actions={actions?.(selectionState)}
      />

      <Table
        columns={columnsWithSelection}
        dataSource={items}
        rowKey={rowKey}
        loading={loading}
        pagination={{
          current: urlState.page,
          pageSize: urlState.pageSize,
          total: totalCount,
          onChange: handlePageChange,
        }}
        serverSort={{
          sortBy: urlState.sortBy,
          sortOrder: urlState.sortOrder,
        }}
        onServerSortChange={urlState.setSort}
        empty={emptyState || <Empty description={emptyDescription} />}
      />
    </>
  );
}

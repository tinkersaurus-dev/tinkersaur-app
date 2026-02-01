import { useCallback, useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import type { TableProps } from './types';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import { Pagination } from './Pagination';
import { Empty } from '../Empty';

export function Table<T = Record<string, unknown>>({
  columns,
  dataSource,
  rowKey: _rowKey,
  pagination = { current: 1, pageSize: 10 },
  loading = false,
  empty,
  className = '',
  onRow,
  header,
  serverSort,
  onServerSortChange,
}: TableProps<T>) {
  // Determine if using server-side sorting
  const isServerSorting = !!onServerSortChange;

  // Local state only used for client-side sorting
  const [clientSorting, setClientSorting] = useState<SortingState>([]);

  // Use the page from props (controlled by parent via URL state)
  const currentPage = pagination !== false ? pagination.current || 1 : 1;

  // Convert serverSort to TanStack format for display
  const sortingState: SortingState = useMemo(() => {
    if (isServerSorting && serverSort?.sortBy) {
      // Find the column that matches this sortBy field
      const sortColumn = columns.find(
        col => (col.sortField || col.key) === serverSort.sortBy
      );
      if (sortColumn) {
        return [{
          id: sortColumn.key,
          desc: serverSort.sortOrder === 'desc'
        }];
      }
    }
    return clientSorting;
  }, [isServerSorting, serverSort, clientSorting, columns]);

  // Handle sorting change
  const handleSortingChange = useCallback((updater: SortingState | ((old: SortingState) => SortingState)) => {
    const newSorting = typeof updater === 'function' ? updater(sortingState) : updater;

    if (isServerSorting && onServerSortChange) {
      if (newSorting.length === 0) {
        onServerSortChange(null, null);
      } else {
        const { id, desc } = newSorting[0];
        // Find the column to get the sortField
        const column = columns.find(col => col.key === id);
        const sortField = column?.sortField || id;
        onServerSortChange(sortField, desc ? 'desc' : 'asc');
      }
    } else {
      setClientSorting(newSorting);
    }
  }, [isServerSorting, onServerSortChange, sortingState, columns]);

  // Convert our column format to TanStack's format
  // Memoize to prevent table reinitialization on every render
  const tanstackColumns: ColumnDef<T>[] = useMemo(() => columns.map((col) => {
    // Base column configuration
    // Use a header function to support ReactNode titles
    const baseConfig = {
      id: col.key,
      header: () => col.title,
      size: typeof col.width === 'number' ? col.width : undefined,
      enableSorting: !!col.sorter,
    };

    // Build column with proper type based on whether we have a render function
    let column: ColumnDef<T>;

    if (col.render) {
      // Custom render column - use accessorFn if we have dataIndex
      if (col.dataIndex) {
        column = {
          ...baseConfig,
          accessorFn: (row) => row[col.dataIndex as keyof T],
          cell: ({ row, getValue }) => {
            const value = getValue();
            return col.render!(value, row.original, row.index);
          },
        };
      } else {
        // Display column with custom render but no data accessor
        column = {
          ...baseConfig,
          accessorFn: () => null,
          cell: ({ row }) => {
            return col.render!(null, row.original, row.index);
          },
        };
      }
    } else if (col.dataIndex) {
      // Accessor column
      column = {
        ...baseConfig,
        accessorKey: col.dataIndex as string,
      };
    } else {
      // Display column (no data access, no render)
      column = {
        ...baseConfig,
        accessorFn: () => null,
      };
    }

    // Handle sorting
    if (col.sorter && typeof col.sorter === 'function') {
      const sorterFn = col.sorter as (a: T, b: T) => number;
      type ExtendedColumnDef = ColumnDef<T> & {
        sortingFn?: (rowA: { original: T }, rowB: { original: T }) => number;
      };
      (column as ExtendedColumnDef).sortingFn = (
        rowA: { original: T },
        rowB: { original: T }
      ) => {
        return sorterFn(rowA.original, rowB.original);
      };
    }

    return column;
  }), [columns]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: dataSource,
    columns: tanstackColumns,
    state: {
      sorting: sortingState,
    },
    onSortingChange: handleSortingChange,
    getCoreRowModel: getCoreRowModel(),
    // Only use client-side sorting model when not server sorting
    getSortedRowModel: isServerSorting ? undefined : getSortedRowModel(),
    // Server handles pagination - we just display what we receive
    manualPagination: true,
    // Enable manual sorting mode for server-side sorting
    manualSorting: isServerSorting,
  });

  const handlePageChange = (page: number, pageSize: number) => {
    if (pagination !== false && pagination.onChange) {
      pagination.onChange(page, pageSize);
    }
  };

  const sectionHeader = header && (
    <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg)] border-b border-[var(--border-muted)]">
      <span className="text-sm font-semibold text-[var(--text)]">{header.title}</span>
      {header.actions && <div>{header.actions}</div>}
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="w-full border border-[var(--border)] rounded-sm overflow-hidden bg-[var(--bg-light)] [box-shadow:var(--shadow)]">
          {sectionHeader}
          <table className="w-full border-collapse">
            <TableHeader headers={table.getHeaderGroups()[0].headers} />
            <tbody>
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-[var(--text-muted)]"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-[var(--primary)] rounded-sm animate-spin" />
                    <span>Loading...</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Empty state
  if (dataSource.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="w-full border border-[var(--border)] rounded-sm overflow-hidden bg-[var(--bg-light)] [box-shadow:var(--shadow)]">
          {sectionHeader}
          <table className="w-full border-collapse">
            <TableHeader headers={table.getHeaderGroups()[0].headers} />
            <tbody>
              <tr>
                <td colSpan={columns.length} className="px-4 py-8">
                  {empty || <Empty description="No data" />}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const rows = table.getRowModel().rows;

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full border border-[var(--border)] rounded-sm overflow-hidden bg-[var(--bg-light)] [box-shadow:var(--shadow)]">
        {sectionHeader}
        <table className="w-full border-collapse">
          <TableHeader headers={table.getHeaderGroups()[0].headers} />
          <TableBody rows={rows} onRow={onRow} />
        </table>
      </div>

      {pagination !== false && dataSource.length > 0 && (
        <Pagination
          config={{
            ...pagination,
            current: currentPage,
            onChange: handlePageChange,
          }}
          total={pagination.total ?? dataSource.length}
        />
      )}
    </div>
  );
}

import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
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
}: TableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [currentPage, setCurrentPage] = useState(
    pagination !== false ? pagination.current || 1 : 1
  );

  // Convert our column format to TanStack's format
  const tanstackColumns: ColumnDef<T>[] = columns.map((col) => {
    // Base column configuration
    const baseConfig = {
      id: col.key,
      header: col.title,
      size: typeof col.width === 'number' ? col.width : undefined,
      enableSorting: !!col.sorter,
    };

    // Build column with proper type based on whether we have a render function
    let column: ColumnDef<T>;

    if (col.render) {
      // Custom render column
      column = {
        ...baseConfig,
        cell: ({ row, getValue }) => {
          const value = col.dataIndex ? row.original[col.dataIndex as keyof T] : getValue();
          return col.render!(value, row.original, row.index);
        },
      };
    } else if (col.dataIndex) {
      // Accessor column
      column = {
        ...baseConfig,
        accessorKey: col.dataIndex as string,
      };
    } else {
      // Display column (no data access)
      column = baseConfig;
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
  });

  const table = useReactTable({
    data: dataSource,
    columns: tanstackColumns,
    state: {
      sorting,
      pagination: pagination !== false ? {
        pageIndex: currentPage - 1,
        pageSize: pagination.pageSize || 10,
      } : undefined,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: pagination !== false ? getPaginationRowModel() : undefined,
    manualPagination: false,
  });

  const handlePageChange = (page: number, pageSize: number) => {
    setCurrentPage(page);
    if (pagination !== false && pagination.onChange) {
      pagination.onChange(page, pageSize);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="w-full border border-[var(--border-muted)] rounded-sm overflow-hidden bg-[var(--bg-light)] [box-shadow:var(--shadow)]">
          <table className="w-full border-collapse">
            <TableHeader headers={table.getHeaderGroups()[0].headers} />
            <tbody>
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-[var(--text-muted)]"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-[var(--primary)] rounded-lg animate-spin" />
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
        <div className="w-full border border-[var(--border-muted)] rounded-sm overflow-hidden bg-[var(--bg-light)] [box-shadow:var(--shadow)]">
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
      <div className="w-full border border-[var(--border-muted)] rounded-sm overflow-hidden bg-[var(--bg-light)] [box-shadow:var(--shadow)]">
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
          total={dataSource.length}
        />
      )}
    </div>
  );
}

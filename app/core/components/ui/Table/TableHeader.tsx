import { flexRender, type Header } from '@tanstack/react-table';
import { MdUnfoldMore, MdArrowUpward, MdArrowDownward } from 'react-icons/md';
import type { SortDirection } from './types';

interface TableHeaderProps<T> {
  headers: Header<T, unknown>[];
}

function SortIndicator({ direction }: { direction: SortDirection }) {
  if (!direction) {
    return <MdUnfoldMore className="ml-1 opacity-40" size={16} />;
  }

  return direction === 'ascend' ? (
    <MdArrowUpward className="ml-1" size={16} />
  ) : (
    <MdArrowDownward className="ml-1" size={16} />
  );
}

export function TableHeader<T>({ headers }: TableHeaderProps<T>) {
  return (
    <thead className="bg-[var(--bg)] border-b border-[var(--border-muted)]">
      <tr>
        {headers.map((header) => {
          const canSort = header.column.getCanSort();
          const sortDirection = header.column.getIsSorted();

          // Convert TanStack's sort direction to our type
          let direction: SortDirection = null;
          if (sortDirection === 'asc') direction = 'ascend';
          if (sortDirection === 'desc') direction = 'descend';

          const width = header.column.columnDef.size;

          return (
            <th
              key={header.id}
              style={width ? { width: typeof width === 'number' ? `${width}px` : width } : undefined}
              className={`
                px-4 py-3 text-left text-sm font-semibold text-[var(--text)]
                ${canSort ? 'cursor-pointer select-none hover:bg-[var(--primary)] hover:text-[var(--text-button)]' : ''}
              `}
              onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
            >
              <div className="flex items-center">
                {flexRender(header.column.columnDef.header, header.getContext())}
                {canSort && <SortIndicator direction={direction} />}
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

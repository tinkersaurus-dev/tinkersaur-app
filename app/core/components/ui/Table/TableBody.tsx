import { flexRender, type Row } from '@tanstack/react-table';
import type { TableRowConfig } from './types';

interface TableBodyProps<T> {
  rows: Row<T>[];
  onRow?: (record: T) => TableRowConfig<T>;
}

export function TableBody<T>({ rows, onRow }: TableBodyProps<T>) {
  return (
    <tbody>
      {rows.map((row) => {
        const rowConfig = onRow?.(row.original) || {};
        const { onClick, onDoubleClick, className: rowClassName } = rowConfig;

        return (
          <tr
            key={row.id}
            onClick={onClick ? () => onClick(row.original) : undefined}
            onDoubleClick={onDoubleClick ? () => onDoubleClick(row.original) : undefined}
            className={`
              border-b border-[var(--border-muted)] hover:bg-[var(--highlight)] transition-colors
              ${onClick || onDoubleClick ? 'cursor-pointer' : ''}
              ${rowClassName || ''}
            `}
          >
            {row.getVisibleCells().map((cell) => {
              const width = cell.column.columnDef.size;

              return (
                <td
                  key={cell.id}
                  style={width ? { width: typeof width === 'number' ? `${width}px` : width } : undefined}
                  className="px-4 py-3 text-sm text-[var(--text-muted)]"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              );
            })}
          </tr>
        );
      })}
    </tbody>
  );
}

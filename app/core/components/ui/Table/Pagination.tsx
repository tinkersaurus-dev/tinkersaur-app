import type { TablePaginationConfig } from './types';

interface PaginationProps {
  config: TablePaginationConfig;
  total: number;
}

export function Pagination({ config, total }: PaginationProps) {
  const {
    current = 1,
    pageSize = 10,
    onChange,
  } = config;

  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    if (onChange && page >= 1 && page <= totalPages) {
      onChange(page, pageSize);
    }
  };

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      if (current <= 3) {
        // Near start
        for (let i = 2; i <= Math.min(5, totalPages - 1); i++) {
          pages.push(i);
        }
        pages.push('...');
      } else if (current >= totalPages - 2) {
        // Near end
        pages.push('...');
        for (let i = Math.max(2, totalPages - 4); i < totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
      }

      // Show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = renderPageNumbers();

  return (
    <div className="flex items-center justify-center gap-1 mt-4 py-3">
      <button
        onClick={() => handlePageChange(current - 1)}
        disabled={current === 1}
        className="px-3 py-1 rounded-sm text-sm text-[var(--text)]  border-[var(--border-muted)]
                   hover:bg-[var(--bg-dark)] disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors"
        aria-label="Previous page"
      >
        Previous
      </button>

      {pageNumbers.map((page, index) => {
        if (page === '...') {
          return (
            <span
              key={`ellipsis-${index}`}
              className="px-2 py-1 text-[var(--text-secondary)]"
            >
              ...
            </span>
          );
        }

        const pageNum = page as number;
        const isActive = pageNum === current;

        return (
          <button
            key={pageNum}
            onClick={() => handlePageChange(pageNum)}
            className={`
              px-3 py-1 rounded-sm text-sm  transition-colors
              ${isActive
                ? 'bg-[var(--primary)] text-[var(--text-button)] border-[var(--primary)]'
                : 'text-[var(--text-muted)] border-[var(--border-muted)] hover:bg-[var(--bg-dark)]'
              }
            `}
            aria-label={`Page ${pageNum}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        onClick={() => handlePageChange(current + 1)}
        disabled={current === totalPages}
        className="px-3 py-1 rounded text-sm text-[var(--text-muted)]
                   hover:bg-[var(--bg-dark)] disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors"
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
}

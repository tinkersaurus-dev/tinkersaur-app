import type { TablePaginationConfig } from './types';
import { APP_CONFIG } from '~/core/config/app-config';
import { Button } from '../Button';
import { Select } from '../Select';

interface PaginationProps {
  config: TablePaginationConfig;
  total: number;
}

export function Pagination({ config, total }: PaginationProps) {
  const {
    current = 1,
    pageSize = APP_CONFIG.pagination.defaultPageSize,
    showSizeChanger = true,
    pageSizeOptions = APP_CONFIG.pagination.pageSizeOptions,
    onChange,
  } = config;

  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    if (onChange && page >= 1 && page <= totalPages) {
      onChange(page, pageSize);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    if (onChange) {
      onChange(1, newPageSize); // Reset to page 1 when changing page size
    }
  };

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > APP_CONFIG.pagination.ellipsisThreshold;

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
        for (let i = 2; i <= Math.min(APP_CONFIG.pagination.maxMiddleButtons, totalPages - 1); i++) {
          pages.push(i);
        }
        pages.push('...');
      } else if (current >= totalPages - 2) {
        // Near end
        pages.push('...');
        for (let i = Math.max(2, totalPages - APP_CONFIG.pagination.endButtonCount); i < totalPages; i++) {
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

  // Create options for page size selector
  const pageSizeSelectOptions = pageSizeOptions?.map((size) => ({
    value: String(size),
    label: String(size),
  })) || [];

  return (
    <div className="flex flex-col items-center gap-2 mt-4 py-3">
      <div className="flex items-center gap-1">
        <Button
          variant="text"
          size="small"
          onClick={() => handlePageChange(current - 1)}
          disabled={current === 1}
          aria-label="Previous page"
        >
          Previous
        </Button>

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
            <Button
              key={pageNum}
              variant={isActive ? 'primary' : 'text'}
              size="small"
              onClick={() => handlePageChange(pageNum)}
              aria-label={`Page ${pageNum}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNum}
            </Button>
          );
        })}

        <Button
          variant="text"
          size="small"
          onClick={() => handlePageChange(current + 1)}
          disabled={current === totalPages}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>

      {showSizeChanger && pageSizeOptions && pageSizeOptions.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <span>Items per page:</span>
          <Select
            value={String(pageSize)}
            onChange={(value) => handlePageSizeChange(Number(value))}
            options={pageSizeSelectOptions}
            size="small"
            aria-label="Items per page"
          />
        </div>
      )}
    </div>
  );
}

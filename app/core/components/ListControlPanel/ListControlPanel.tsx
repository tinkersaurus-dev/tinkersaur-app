import { useState, useEffect, useCallback } from 'react';
import { LuSearch } from 'react-icons/lu';
import { Select, MultiSelect } from '~/core/components/ui';
import type { SelectOption } from '~/core/components/ui';
import type { MultiSelectOption } from '~/core/components/ui/MultiSelect';

interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'multiselect';
  options: SelectOption[] | MultiSelectOption[];
  placeholder?: string;
  showSearch?: boolean;
}

interface ListControlPanelProps {
  // Search
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  debounceMs?: number;

  // Filters
  filters?: FilterConfig[];
  filterValues?: Record<string, string | string[]>;
  onFilterChange?: (key: string, value: string | string[]) => void;

  // Actions slot (for bulk actions when items selected)
  actions?: React.ReactNode;

  // Selection info
  selectedCount?: number;
}

/**
 * Reusable control panel for list pages with search, filters, and actions
 */
export function ListControlPanel({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  debounceMs = 300,
  filters = [],
  filterValues = {},
  onFilterChange,
  actions,
  selectedCount = 0,
}: ListControlPanelProps) {
  const [localSearch, setLocalSearch] = useState(searchValue);

  // Sync local state with prop
  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchValue) {
        onSearchChange(localSearch);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localSearch, searchValue, onSearchChange, debounceMs]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
  }, []);

  return (
    <div className="bg-[var(--bg-light)] border border-[var(--border-muted)] rounded-md p-4 mb-4">
      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={localSearch}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
            className="w-full h-9 pl-9 pr-3 text-sm bg-[var(--bg)] border border-[var(--border-muted)] rounded-[var(--radius-sm)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20"
          />
        </div>

        {/* Dynamic Filters */}
        {filters.map((filter) => (
          <div key={filter.key} className="min-w-[180px]">
            {filter.type === 'select' ? (
              <Select
                value={(filterValues[filter.key] as string) || ''}
                onChange={(value) => onFilterChange?.(filter.key, value)}
                options={[
                  { value: '', label: `All ${filter.label}` },
                  ...(filter.options as SelectOption[]),
                ]}
                placeholder={filter.placeholder || `Filter by ${filter.label}`}
                showSearch={filter.showSearch}
                size="small"
              />
            ) : (
              <MultiSelect
                value={(filterValues[filter.key] as string[]) || []}
                onChange={(value) => onFilterChange?.(filter.key, value)}
                options={filter.options as MultiSelectOption[]}
                placeholder={filter.placeholder || `Filter by ${filter.label}`}
                showSearch={filter.showSearch}
                size="small"
              />
            )}
          </div>
        ))}
      </div>

      {/* Actions Row (shows when items selected or actions provided) */}
      {(selectedCount > 0 || actions) && (
        <div className="mt-3 pt-3 border-t border-[var(--border-muted)] flex items-center gap-3">
          {selectedCount > 0 && (
            <span className="text-sm text-[var(--text-muted)]">
              {selectedCount} selected
            </span>
          )}
          {actions}
        </div>
      )}
    </div>
  );
}

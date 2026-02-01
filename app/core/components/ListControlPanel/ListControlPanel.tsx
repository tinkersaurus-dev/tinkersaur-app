import { useState, useEffect, useCallback } from 'react';
import { Select, MultiSelect, SearchInput } from '@/shared/ui';
import type { SelectOption } from '@/shared/ui';
import type { MultiSelectOption } from '@/shared/ui/MultiSelect';

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

  const handleClearSearch = useCallback(() => {
    setLocalSearch('');
    onSearchChange('');
  }, [onSearchChange]);

  return (
    <div className="bg-[var(--bg-light)] border border-[var(--border-muted)] rounded-md p-4 mb-4">
      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search Input */}
        <div className="flex-1 min-w-[180px] max-w-[clamp(200px,20vw,350px)]">
          <SearchInput
            value={localSearch}
            onChange={handleSearchChange}
            onClear={handleClearSearch}
            placeholder={searchPlaceholder}
            size="medium"
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

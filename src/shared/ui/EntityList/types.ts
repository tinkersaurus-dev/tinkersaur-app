import type { ReactNode } from 'react';
import type { TableColumn } from '../Table';
import type { SelectOption } from '../Select';
import type { MultiSelectOption } from '../MultiSelect';
import type { SortOrder } from '../../api/types';

// Re-export for convenience
export type { TableColumn };

/**
 * Configuration for a filter in the control panel
 */
export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'multiselect';
  options: SelectOption[] | MultiSelectOption[];
  placeholder?: string;
  showSearch?: boolean;
}

/**
 * Selection state exposed to consumers
 */
export interface SelectionState<T> {
  selectedIds: Set<string>;
  selectedItems: T[];
  selectedCount: number;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  clear: () => void;
}

/**
 * URL state shape (from useListUrlState hook)
 */
export interface ListUrlState {
  page: number;
  pageSize: number;
  search: string;
  filters: Record<string, string>;
  sortBy: string | null;
  sortOrder: SortOrder | null;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearch: (search: string) => void;
  setFilter: (key: string, value: string | string[]) => void;
  setPageChange: (page: number, pageSize: number) => void;
  clearFilters: () => void;
  setSort: (sortBy: string | null, sortOrder: SortOrder | null) => void;
}

/**
 * Props for EntityList component
 */
export interface EntityListProps<T extends { id: string }> {
  /** Data items to display */
  items: T[];

  /** Loading state */
  loading: boolean;

  /** Total count for pagination */
  totalCount: number;

  /** URL state from useListUrlState hook */
  urlState: ListUrlState;

  /**
   * Table columns (without selection column - added automatically)
   * Should NOT include the checkbox column
   */
  columns: TableColumn<T>[];

  /** Filter configurations */
  filters?: FilterConfig[];

  /**
   * Keys of filters that should be treated as multi-select
   * Values will be parsed from comma-separated strings
   */
  multiSelectFilterKeys?: string[];

  /**
   * Render function for actions based on selection state
   * Typically shows merge button when >= 2 items selected
   */
  actions?: (selection: SelectionState<T>) => ReactNode;

  /**
   * Callback when selection changes
   * Useful for syncing with external state
   */
  onSelectionChange?: (selection: SelectionState<T>) => void;

  /** Placeholder text for search input */
  searchPlaceholder?: string;

  /** Custom empty state element */
  emptyState?: ReactNode;

  /** Simple empty state description (used if emptyState not provided) */
  emptyDescription?: string;

  /**
   * Row key for table
   * @default 'id'
   */
  rowKey?: keyof T | ((record: T) => string);

  /**
   * Enable selection functionality
   * @default true
   */
  selectable?: boolean;
}

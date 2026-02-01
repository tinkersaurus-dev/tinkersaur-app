import { useSearchParams } from 'react-router';
import { useCallback, useMemo } from 'react';
import type { SortOrder } from '../api/types';

interface ListUrlState {
  page: number;
  pageSize: number;
  search: string;
  filters: Record<string, string>;
  sortBy: string | null;
  sortOrder: SortOrder | null;
}

interface UseListUrlStateOptions {
  defaultPageSize?: number;
  filterKeys: string[];
  defaultSortBy?: string;
  defaultSortOrder?: SortOrder;
}

/**
 * Hook for syncing list filter state with URL search params
 * Enables shareable links with filters
 */
export function useListUrlState({
  defaultPageSize = 10,
  filterKeys,
  defaultSortBy,
  defaultSortOrder,
}: UseListUrlStateOptions) {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo<ListUrlState>(() => ({
    page: parseInt(searchParams.get('page') || '1', 10),
    pageSize: parseInt(searchParams.get('pageSize') || String(defaultPageSize), 10),
    search: searchParams.get('search') || '',
    filters: filterKeys.reduce((acc, key) => {
      const value = searchParams.get(key);
      if (value) acc[key] = value;
      return acc;
    }, {} as Record<string, string>),
    sortBy: searchParams.get('sortBy') || defaultSortBy || null,
    sortOrder: (searchParams.get('sortOrder') as SortOrder) || defaultSortOrder || null,
  }), [searchParams, defaultPageSize, filterKeys, defaultSortBy, defaultSortOrder]);

  const setPage = useCallback((page: number) => {
    setSearchParams((prev) => {
      prev.set('page', String(page));
      return prev;
    }, { replace: true });
  }, [setSearchParams]);

  const setPageSize = useCallback((pageSize: number) => {
    setSearchParams((prev) => {
      prev.set('pageSize', String(pageSize));
      prev.set('page', '1'); // Reset to first page
      return prev;
    }, { replace: true });
  }, [setSearchParams]);

  const setSearch = useCallback((search: string) => {
    setSearchParams((prev) => {
      if (search) {
        prev.set('search', search);
      } else {
        prev.delete('search');
      }
      prev.set('page', '1');
      return prev;
    }, { replace: true });
  }, [setSearchParams]);

  const setFilter = useCallback((key: string, value: string | string[]) => {
    setSearchParams((prev) => {
      // Convert arrays to comma-separated strings for URL storage
      const stringValue = Array.isArray(value) ? value.join(',') : value;
      if (stringValue) {
        prev.set(key, stringValue);
      } else {
        prev.delete(key);
      }
      prev.set('page', '1');
      return prev;
    }, { replace: true });
  }, [setSearchParams]);

  const setPageChange = useCallback((page: number, pageSize: number) => {
    setSearchParams((prev) => {
      prev.set('page', String(page));
      prev.set('pageSize', String(pageSize));
      return prev;
    }, { replace: true });
  }, [setSearchParams]);

  const clearFilters = useCallback(() => {
    setSearchParams((prev) => {
      filterKeys.forEach(key => prev.delete(key));
      prev.delete('search');
      prev.set('page', '1');
      return prev;
    }, { replace: true });
  }, [setSearchParams, filterKeys]);

  const setSort = useCallback((sortBy: string | null, sortOrder: SortOrder | null) => {
    setSearchParams((prev) => {
      if (sortBy) {
        prev.set('sortBy', sortBy);
      } else {
        prev.delete('sortBy');
      }
      if (sortOrder) {
        prev.set('sortOrder', sortOrder);
      } else {
        prev.delete('sortOrder');
      }
      prev.set('page', '1'); // Reset to first page on sort change
      return prev;
    }, { replace: true });
  }, [setSearchParams]);

  return {
    ...state,
    setPage,
    setPageSize,
    setSearch,
    setFilter,
    setPageChange,
    clearFilters,
    setSort,
  };
}

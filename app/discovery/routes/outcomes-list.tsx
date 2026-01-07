/**
 * Outcomes List Page
 * Displays all outcomes in a paginated table with filtering and multi-select
 */

import { useMemo, useRef, useEffect } from 'react';
import { FiPlus } from 'react-icons/fi';
import { PageHeader, PageContent } from '~/core/components';
import { MainLayout } from '~/core/components/MainLayout';
import { ListControlPanel } from '~/core/components/ListControlPanel';
import { Button, Table, Empty } from '~/core/components/ui';
import type { TableColumn } from '~/core/components/ui';
import type { Outcome } from '~/core/entities/discovery';
import { useOutcomesPaginatedQuery } from '../queries';
import { useSolutionsQuery } from '~/product-management/queries';
import { useListSelection, useListUrlState } from '~/core/hooks';
import { useAuthStore } from '~/core/auth';

export default function OutcomesListPage() {
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const teamId = selectedTeam?.teamId;

  // URL state for pagination and filters
  const urlState = useListUrlState({
    filterKeys: ['solutionId'],
  });

  // Build query params from URL state
  const queryParams = useMemo(() => {
    if (!teamId) return null;
    return {
      teamId,
      page: urlState.page,
      pageSize: urlState.pageSize,
      search: urlState.search || undefined,
      solutionId: urlState.filters.solutionId || undefined,
    };
  }, [teamId, urlState.page, urlState.pageSize, urlState.search, urlState.filters.solutionId]);

  // Data fetching
  const { data, isLoading } = useOutcomesPaginatedQuery(queryParams);
  const { data: solutions = [] } = useSolutionsQuery(teamId);

  // Multi-select for future bulk actions
  const selection = useListSelection({
    items: data?.items || [],
    getItemId: (item) => item.id,
  });

  // Table columns with checkbox
  const columns: TableColumn<Outcome>[] = useMemo(() => [
    {
      key: 'selection',
      title: '',
      width: 48,
      render: (_, record) => (
        <input
          type="checkbox"
          checked={selection.isSelected(record.id)}
          onChange={() => selection.toggle(record.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-[var(--border)] cursor-pointer accent-[var(--primary)]"
        />
      ),
    },
    {
      key: 'description',
      title: 'Description',
      dataIndex: 'description',
      render: (value) => (
        <span className="line-clamp-2 text-sm">
          {value as string}
        </span>
      ),
    },
    {
      key: 'target',
      title: 'Target',
      dataIndex: 'target',
      width: 200,
      render: (value) => (
        <span className="line-clamp-2 text-sm text-[var(--text-muted)]">
          {value as string || '—'}
        </span>
      ),
    },
    {
      key: 'solution',
      title: 'Solution',
      dataIndex: 'solutionId',
      width: 150,
      render: (value) => {
        if (!value) return <span className="text-[var(--text-muted)]">—</span>;
        const solution = solutions.find(s => s.id === value);
        return (
          <span className="text-sm">
            {solution?.name || 'Unknown'}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      title: 'Created',
      dataIndex: 'createdAt',
      width: 120,
      render: (value) => (
        <span className="text-sm text-[var(--text-muted)]">
          {new Date(value as Date).toLocaleDateString()}
        </span>
      ),
    },
  ], [selection, solutions]);

  // Select all checkbox in header
  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selection.isIndeterminate;
    }
  }, [selection.isIndeterminate]);

  // Update first column to have select-all checkbox
  const columnsWithSelectAll = useMemo(() => {
    const cols = [...columns];
    cols[0] = {
      ...cols[0],
      title: (
        <input
          ref={selectAllRef}
          type="checkbox"
          checked={selection.isAllSelected}
          onChange={selection.toggleAll}
          className="w-4 h-4 rounded border-[var(--border)] cursor-pointer accent-[var(--primary)]"
        />
      ),
    };
    return cols;
  }, [columns, selection.isAllSelected, selection.toggleAll]);

  // Filter configuration
  const filters = useMemo(() => [
    {
      key: 'solutionId',
      label: 'Solutions',
      type: 'select' as const,
      options: solutions.map((s) => ({ value: s.id, label: s.name })),
      showSearch: true,
    },
  ], [solutions]);

  // Handle page change
  const handlePageChange = (page: number, pageSize: number) => {
    urlState.setPageChange(page, pageSize);
    selection.clear();
  };

  return (
    <MainLayout>
      <PageHeader
        title="Outcomes"
        actions={
          <Button
            variant="primary"
            icon={<FiPlus />}
            onClick={() => {/* TODO: Add modal */}}
          >
            Add Outcome
          </Button>
        }
      />

      <PageContent>
        {!teamId ? (
          <Empty description="No team selected. Please create an organization and team first." />
        ) : (
          <>
            <ListControlPanel
              searchValue={urlState.search}
              onSearchChange={urlState.setSearch}
              searchPlaceholder="Search outcomes..."
              filters={filters}
              filterValues={urlState.filters}
              onFilterChange={urlState.setFilter}
              selectedCount={selection.selectedIds.size}
            />

            <Table
              columns={columnsWithSelectAll}
              dataSource={data?.items || []}
              rowKey="id"
              loading={isLoading}
              pagination={{
                current: urlState.page,
                pageSize: urlState.pageSize,
                total: data?.totalCount,
                onChange: handlePageChange,
              }}
              empty={<Empty description="No outcomes found. Adjust your filters or add new outcomes." />}
            />
          </>
        )}
      </PageContent>
    </MainLayout>
  );
}

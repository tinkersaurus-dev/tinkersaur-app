/**
 * Outcomes List Page
 * Displays all outcomes in a paginated table with filtering and multi-select
 */

import { useMemo } from 'react';
import { Link } from 'react-router';
import { FiPlus } from 'react-icons/fi';
import { PageHeader, PageContent } from '~/core/components';
import { MainLayout } from '~/core/components/MainLayout';
import { ListControlPanel } from '~/core/components/ListControlPanel';
import { Button, Table, Empty, Checkbox } from '~/core/components/ui';
import type { TableColumn } from '~/core/components/ui';
import type { Outcome } from '~/core/entities/discovery';
import { useOutcomesPaginatedQuery } from '../queries';
import { useSolutionsQuery } from '~/product-management/queries';
import { useListSelection, useListUrlState } from '~/core/hooks';
import { useAuthStore } from '~/core/auth';

export default function OutcomesListPage() {
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const teamId = selectedTeam?.teamId;

  // URL state for pagination, filters, and sorting
  const urlState = useListUrlState({
    filterKeys: ['solutionId'],
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
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
      sortBy: urlState.sortBy || undefined,
      sortOrder: urlState.sortOrder || undefined,
    };
  }, [teamId, urlState.page, urlState.pageSize, urlState.search, urlState.filters.solutionId, urlState.sortBy, urlState.sortOrder]);

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
        <Checkbox
          checked={selection.isSelected(record.id)}
          onChange={() => selection.toggle(record.id)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: 'description',
      title: 'Description',
      dataIndex: 'description',
      sorter: true,
      sortField: 'description',
      render: (_, record) => (
        <Link
          to={`/discovery/organize/outcomes/${record.id}`}
          className="text-[var(--primary)] hover:underline line-clamp-2 text-sm"
        >
          {record.description}
        </Link>
      ),
    },
    {
      key: 'target',
      title: 'Target',
      dataIndex: 'target',
      width: 200,
      sorter: true,
      sortField: 'target',
      render: (value) => (
        <span className="line-clamp-2text-[var(--text-muted)]">
          {value as string || '—'}
        </span>
      ),
    },
    {
      key: 'solution',
      title: 'Solution',
      dataIndex: 'solutionId',
      width: 150,
      sorter: true,
      sortField: 'solutionId',
      render: (value) => {
        if (!value) return <span className="text-[var(--text-muted)]">—</span>;
        const solution = solutions.find(s => s.id === value);
        return (
          <span>
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
      sorter: true,
      sortField: 'createdAt',
      render: (value) => (
        <span className="text-[var(--text-muted)]">
          {new Date(value as Date).toLocaleDateString()}
        </span>
      ),
    },
  ], [selection, solutions]);

  // Update first column to have select-all checkbox
  const columnsWithSelectAll = useMemo(() => {
    const cols = [...columns];
    cols[0] = {
      ...cols[0],
      title: (
        <Checkbox
          checked={selection.isAllSelected}
          indeterminate={selection.isIndeterminate}
          onChange={selection.toggleAll}
        />
      ),
    };
    return cols;
  }, [columns, selection.isAllSelected, selection.isIndeterminate, selection.toggleAll]);

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
              serverSort={{
                sortBy: urlState.sortBy,
                sortOrder: urlState.sortOrder,
              }}
              onServerSortChange={urlState.setSort}
              empty={<Empty description="No outcomes found. Adjust your filters or add new outcomes." />}
            />
          </>
        )}
      </PageContent>
    </MainLayout>
  );
}

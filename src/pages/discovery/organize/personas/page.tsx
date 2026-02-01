/**
 * Personas List Page
 * Displays all personas in a paginated table with filtering and multi-select
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { FiPlus, FiGitMerge } from 'react-icons/fi';
import { PageHeader, PageContent } from '~/core/components';
import { MainLayout } from '@/app/layouts/MainLayout';
import { ListControlPanel } from '~/core/components/ListControlPanel';
import { Button, Table, Empty, Checkbox } from '@/shared/ui';
import type { TableColumn } from '@/shared/ui';
import type { Persona } from '@/entities/persona';
import { usePersonasPaginatedQuery, useSolutionsQuery } from '~/product-management/queries';
import { useListSelection, useListUrlState } from '@/shared/hooks';
import { useAuthStore } from '@/features/auth';
import { PersonaMergeModal } from '@/features/entity-merging';

export default function PersonasListPage() {
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
  const { data, isLoading } = usePersonasPaginatedQuery(queryParams);
  const { data: solutions = [] } = useSolutionsQuery(teamId);

  // Multi-select for bulk actions
  const selection = useListSelection({
    items: data?.items || [],
    getItemId: (item) => item.id,
  });

  // Merge modal state
  const [mergeModalOpen, setMergeModalOpen] = useState(false);

  // Table columns with checkbox
  const columns: TableColumn<Persona>[] = useMemo(() => [
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
      key: 'name',
      title: 'Name',
      width: 200,
      dataIndex: 'name',
      sorter: true,
      sortField: 'name',
      render: (_, record) => (
        <Link
          to={`/discovery/organize/personas/${record.id}`}
          className="text-[var(--primary)] text-sm hover:underline font-medium"
        >
          {record.name}
        </Link>
      ),
    },
    {
      key: 'role',
      title: 'Role',
      dataIndex: 'role',
      sorter: true,
      sortField: 'role',
      render: (value) => (
        <span className="text-[var(--text-muted)]">{value as string || '—'}</span>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      dataIndex: 'description',
      sorter: true,
      sortField: 'description',
      render: (value) => (
        <span className="line-clamp-2 text-[var(--text-muted)]">
          {value as string || '—'}
        </span>
      ),
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
  ], [selection]);

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
    selection.clear(); // Clear selection on page change
  };

  return (
    <MainLayout>
      <PageHeader
        title="Personas"
        actions={
          <Button
            variant="primary"
            icon={<FiPlus />}
            onClick={() => {/* TODO: Add modal */}}
          >
            Add Persona
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
              searchPlaceholder="Search personas..."
              filters={filters}
              filterValues={urlState.filters}
              onFilterChange={urlState.setFilter}
              selectedCount={selection.selectedIds.size}
              actions={
                selection.selectedIds.size >= 2 ? (
                  <Button
                    variant="default"
                    icon={<FiGitMerge />}
                    onClick={() => setMergeModalOpen(true)}
                  >
                    Merge ({selection.selectedIds.size})
                  </Button>
                ) : undefined
              }
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
              empty={<Empty description="No personas found. Adjust your filters or create a new persona." />}
            />
          </>
        )}
      </PageContent>

      {/* Merge Modal */}
      {teamId && (
        <PersonaMergeModal
          open={mergeModalOpen}
          onClose={() => {
            setMergeModalOpen(false);
            selection.clear();
          }}
          selectedPersonas={selection.selectedItems}
          teamId={teamId}
        />
      )}
    </MainLayout>
  );
}

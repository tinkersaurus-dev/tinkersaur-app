/**
 * Personas List Page
 * Displays all personas in a paginated table with filtering and multi-select
 */

import { useMemo, useRef, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { FiPlus, FiGitMerge } from 'react-icons/fi';
import { PageHeader, PageContent } from '~/core/components';
import { MainLayout } from '~/core/components/MainLayout';
import { ListControlPanel } from '~/core/components/ListControlPanel';
import { Button, Table, Empty } from '~/core/components/ui';
import type { TableColumn } from '~/core/components/ui';
import type { Persona } from '~/core/entities/product-management';
import { usePersonasPaginatedQuery, useSolutionsQuery } from '../queries';
import { useListSelection, useListUrlState } from '~/core/hooks';
import { useAuthStore } from '~/core/auth';
import { PersonaMergeModal } from '../components';

export default function PersonasListPage() {
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
      key: 'name',
      title: 'Name',
      dataIndex: 'name',
      render: (_, record) => (
        <Link
          to={`/discovery/organize/personas/${record.id}`}
          className="text-[var(--primary)] hover:underline font-medium"
        >
          {record.name}
        </Link>
      ),
    },
    {
      key: 'role',
      title: 'Role',
      dataIndex: 'role',
      render: (value) => (
        <span className="text-[var(--text-muted)]">{value as string || '—'}</span>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      dataIndex: 'description',
      render: (value) => (
        <span className="line-clamp-2 text-sm text-[var(--text-muted)]">
          {value as string || '—'}
        </span>
      ),
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
  ], [selection]);

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

/**
 * Use Cases List Page
 * Displays all use cases in a paginated table with filtering and multi-select
 */

import { useMemo, useRef, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { FiPlus, FiGitMerge } from 'react-icons/fi';
import { PageHeader, PageContent } from '~/core/components';
import { MainLayout } from '~/core/components/MainLayout';
import { ListControlPanel } from '~/core/components/ListControlPanel';
import { Button, Table, Empty } from '~/core/components/ui';
import type { TableColumn } from '~/core/components/ui';
import type { UseCase } from '~/core/entities/product-management';
import { useUseCasesPaginatedQuery, useSolutionsQuery, usePersonasQuery } from '../queries';
import { useListSelection, useListUrlState } from '~/core/hooks';
import { useAuthStore } from '~/core/auth';
import { UseCaseMergeModal } from '../components/UseCaseMergeModal';
import { CreateUseCaseModal } from '../components/CreateUseCaseModal';

export default function UseCasesListPage() {
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const teamId = selectedTeam?.teamId;

  // URL state for pagination, filters, and sorting
  const urlState = useListUrlState({
    filterKeys: ['solutionId', 'personaIds'],
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  });

  // Parse personaIds from URL (comma-separated)
  const personaIds = useMemo(() => {
    const ids = urlState.filters.personaIds;
    if (!ids) return undefined;
    return ids.split(',').filter(Boolean);
  }, [urlState.filters.personaIds]);

  // Build query params from URL state
  const queryParams = useMemo(() => {
    if (!teamId) return null;
    return {
      teamId,
      page: urlState.page,
      pageSize: urlState.pageSize,
      search: urlState.search || undefined,
      solutionId: urlState.filters.solutionId || undefined,
      personaIds,
      sortBy: urlState.sortBy || undefined,
      sortOrder: urlState.sortOrder || undefined,
    };
  }, [teamId, urlState.page, urlState.pageSize, urlState.search, urlState.filters.solutionId, personaIds, urlState.sortBy, urlState.sortOrder]);

  // Data fetching
  const { data, isLoading } = useUseCasesPaginatedQuery(queryParams);
  const { data: solutions = [] } = useSolutionsQuery(teamId);
  const { data: personas = [] } = usePersonasQuery(teamId);

  // Multi-select for bulk actions
  const selection = useListSelection({
    items: data?.items || [],
    getItemId: (item) => item.id,
  });

  // Modal state
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Get selected use case objects for merge modal
  const items = data?.items;
  const selectedUseCases = useMemo(() => {
    if (!items) return [];
    return items.filter((uc) => selection.isSelected(uc.id));
  }, [items, selection]);

  // Table columns with checkbox
  const columns: TableColumn<UseCase>[] = useMemo(() => [
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
      sorter: true,
      sortField: 'name',
      render: (_, record) => (
        <Link
          to={`/discovery/organize/use-cases/${record.id}`}
          className="text-[var(--primary)] text-sm hover:underline font-medium"
        >
          {record.name}
        </Link>
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
      key: 'solution',
      title: 'Solution',
      dataIndex: 'solutionId',
      width: 150,
      sorter: true,
      sortField: 'solutionId',
      render: (value) => {
        if (!value) return <span className="text-[var(--text-muted)]">Unassigned</span>;
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
    {
      key: 'personaIds',
      label: 'Personas',
      type: 'multiselect' as const,
      options: personas.map((p) => ({ value: p.id, label: p.name })),
      showSearch: true,
    },
  ], [solutions, personas]);

  // Handle filter change (special handling for multi-select)
  const handleFilterChange = (key: string, value: string | string[]) => {
    if (Array.isArray(value)) {
      // Convert array to comma-separated string for URL
      urlState.setFilter(key, value.join(','));
    } else {
      urlState.setFilter(key, value);
    }
  };

  // Get filter values with personaIds as array
  const filterValues = useMemo(() => ({
    ...urlState.filters,
    personaIds: personaIds || [],
  }), [urlState.filters, personaIds]);

  // Handle page change
  const handlePageChange = (page: number, pageSize: number) => {
    urlState.setPageChange(page, pageSize);
    selection.clear();
  };

  // Handle merge modal close
  const handleMergeModalClose = () => {
    setIsMergeModalOpen(false);
    selection.clear();
  };

  return (
    <MainLayout>
      <PageHeader
        title="Use Cases"
        actions={
          <Button
            variant="primary"
            icon={<FiPlus />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Add Use Case
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
              searchPlaceholder="Search use cases..."
              filters={filters}
              filterValues={filterValues}
              onFilterChange={handleFilterChange}
              selectedCount={selection.selectedIds.size}
              actions={
                selection.selectedIds.size >= 2 && (
                  <Button
                    variant="default"
                    size="small"
                    icon={<FiGitMerge />}
                    onClick={() => setIsMergeModalOpen(true)}
                  >
                    Merge Selected
                  </Button>
                )
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
              empty={<Empty description="No use cases found. Adjust your filters or create a new use case." />}
            />
          </>
        )}
      </PageContent>

      {/* Merge Modal */}
      {teamId && (
        <UseCaseMergeModal
          open={isMergeModalOpen}
          onClose={handleMergeModalClose}
          selectedUseCases={selectedUseCases}
          teamId={teamId}
          solutions={solutions}
        />
      )}

      {/* Create Modal */}
      {teamId && (
        <CreateUseCaseModal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          teamId={teamId}
          solutions={solutions}
        />
      )}
    </MainLayout>
  );
}

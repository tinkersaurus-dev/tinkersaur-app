/**
 * Feedback List Page
 * Displays all feedback in a paginated table with filtering and multi-select
 */

import { useMemo, useRef, useEffect } from 'react';
import { FiPlus } from 'react-icons/fi';
import { PageHeader, PageContent } from '~/core/components';
import { MainLayout } from '~/core/components/MainLayout';
import { ListControlPanel } from '~/core/components/ListControlPanel';
import { Button, Table, Empty, Tag } from '~/core/components/ui';
import type { TableColumn, TagColor } from '~/core/components/ui';
import type { Feedback } from '~/core/entities/discovery';
import { FEEDBACK_TYPE_CONFIG } from '~/core/entities/discovery/types/Feedback';
import { useFeedbacksPaginatedQuery } from '../queries';
import { useSolutionsQuery, usePersonasQuery, useUseCasesByTeamQuery } from '~/product-management/queries';
import { useListSelection, useListUrlState } from '~/core/hooks';
import { useAuthStore } from '~/core/auth';

export default function FeedbackListPage() {
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const teamId = selectedTeam?.teamId;

  // URL state for pagination and filters
  const urlState = useListUrlState({
    filterKeys: ['solutionId', 'personaIds', 'useCaseIds'],
  });

  // Parse multi-select IDs from URL (comma-separated)
  const personaIds = useMemo(() => {
    const ids = urlState.filters.personaIds;
    if (!ids) return undefined;
    return ids.split(',').filter(Boolean);
  }, [urlState.filters.personaIds]);

  const useCaseIds = useMemo(() => {
    const ids = urlState.filters.useCaseIds;
    if (!ids) return undefined;
    return ids.split(',').filter(Boolean);
  }, [urlState.filters.useCaseIds]);

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
      useCaseIds,
    };
  }, [teamId, urlState.page, urlState.pageSize, urlState.search, urlState.filters.solutionId, personaIds, useCaseIds]);

  // Data fetching
  const { data, isLoading } = useFeedbacksPaginatedQuery(queryParams);
  const { data: solutions = [] } = useSolutionsQuery(teamId);
  const { data: personas = [] } = usePersonasQuery(teamId);
  const { data: useCases = [] } = useUseCasesByTeamQuery(teamId);

  // Multi-select for future bulk actions
  const selection = useListSelection({
    items: data?.items || [],
    getItemId: (item) => item.id,
  });

  // Map feedback type to tag color
  const getTypeColor = (type: string): TagColor => {
    const config = FEEDBACK_TYPE_CONFIG[type as keyof typeof FEEDBACK_TYPE_CONFIG];
    return (config?.color || 'default') as TagColor;
  };

  // Table columns with checkbox
  const columns: TableColumn<Feedback>[] = useMemo(() => [
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
      key: 'type',
      title: 'Type',
      dataIndex: 'type',
      width: 100,
      render: (value) => {
        const type = value as string;
        const config = FEEDBACK_TYPE_CONFIG[type as keyof typeof FEEDBACK_TYPE_CONFIG];
        return (
          <Tag color={getTypeColor(type)}>
            {config?.label || type}
          </Tag>
        );
      },
    },
    {
      key: 'content',
      title: 'Content',
      dataIndex: 'content',
      render: (value) => (
        <span className="line-clamp-2 text-sm">
          {value as string}
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
      key: 'confidence',
      title: 'Confidence',
      dataIndex: 'confidence',
      width: 100,
      render: (value) => (
        <span className="text-sm text-[var(--text-muted)]">
          {Math.round((value as number) * 100)}%
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
    {
      key: 'useCaseIds',
      label: 'Use Cases',
      type: 'multiselect' as const,
      options: useCases.map((uc) => ({ value: uc.id, label: uc.name })),
      showSearch: true,
    },
  ], [solutions, personas, useCases]);

  // Handle filter change (special handling for multi-select)
  const handleFilterChange = (key: string, value: string | string[]) => {
    if (Array.isArray(value)) {
      urlState.setFilter(key, value.join(','));
    } else {
      urlState.setFilter(key, value);
    }
  };

  // Get filter values with arrays for multi-select
  const filterValues = useMemo(() => ({
    ...urlState.filters,
    personaIds: personaIds || [],
    useCaseIds: useCaseIds || [],
  }), [urlState.filters, personaIds, useCaseIds]);

  // Handle page change
  const handlePageChange = (page: number, pageSize: number) => {
    urlState.setPageChange(page, pageSize);
    selection.clear();
  };

  return (
    <MainLayout>
      <PageHeader
        title="Feedback"
        actions={
          <Button
            variant="primary"
            icon={<FiPlus />}
            onClick={() => {/* TODO: Add modal */}}
          >
            Add Feedback
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
              searchPlaceholder="Search feedback..."
              filters={filters}
              filterValues={filterValues}
              onFilterChange={handleFilterChange}
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
              empty={<Empty description="No feedback found. Adjust your filters or add new feedback." />}
            />
          </>
        )}
      </PageContent>
    </MainLayout>
  );
}

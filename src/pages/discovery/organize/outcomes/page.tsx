/**
 * Outcomes List Page
 * Displays all outcomes in a paginated table with filtering
 */

import { useMemo } from 'react';
import { Link } from 'react-router';
import { FiPlus, FiX } from 'react-icons/fi';
import { PageHeader, PageContent, EntityList, Empty } from '@/shared/ui';
import { Button } from '@/shared/ui';
import type { TableColumn, FilterConfig } from '@/shared/ui';
import type { Outcome } from '@/entities/outcome';
import { useOutcomesPaginatedQuery, useOutcomesQuery, filterUnlinkedOutcomes } from '@/entities/outcome';
import { useSolutionsQuery } from '@/entities/solution';
import { useListUrlState } from '@/shared/hooks';
import { useAuthStore } from '@/features/auth';

export default function OutcomesListPage() {
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const teamId = selectedTeam?.teamId;

  // URL state for pagination, filters, and sorting
  const urlState = useListUrlState({
    filterKeys: ['solutionId', 'unlinked'],
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  });

  const isUnlinkedFilter = urlState.filters.unlinked === 'true';

  // Build query params from URL state (disabled when using unlinked filter)
  const queryParams = useMemo(() => {
    if (!teamId || isUnlinkedFilter) return null;
    return {
      teamId,
      page: urlState.page,
      pageSize: urlState.pageSize,
      search: urlState.search || undefined,
      solutionId: urlState.filters.solutionId || undefined,
      sortBy: urlState.sortBy || undefined,
      sortOrder: urlState.sortOrder || undefined,
    };
  }, [teamId, isUnlinkedFilter, urlState.page, urlState.pageSize, urlState.search, urlState.filters.solutionId, urlState.sortBy, urlState.sortOrder]);

  // Data fetching
  const { data, isLoading } = useOutcomesPaginatedQuery(queryParams);
  const { data: allOutcomes = [], isLoading: allOutcomesLoading } =
    useOutcomesQuery(isUnlinkedFilter ? teamId : undefined);
  const { data: solutions = [] } = useSolutionsQuery(teamId);

  // Client-side filtering for unlinked outcomes
  const unlinkedData = useMemo(() => {
    if (!isUnlinkedFilter) return null;
    const filtered = filterUnlinkedOutcomes(allOutcomes);
    const start = (urlState.page - 1) * urlState.pageSize;
    return {
      items: filtered.slice(start, start + urlState.pageSize),
      totalCount: filtered.length,
    };
  }, [isUnlinkedFilter, allOutcomes, urlState.page, urlState.pageSize]);

  const displayData = isUnlinkedFilter ? unlinkedData : data;
  const displayLoading = isUnlinkedFilter ? allOutcomesLoading : isLoading;

  // Table columns (without selection - EntityList adds it)
  const columns: TableColumn<Outcome>[] = useMemo(() => [
    {
      key: 'description',
      title: 'Description',
      dataIndex: 'description',
      sorter: true,
      sortField: 'description',
      render: (_, record) => (
        <Link
          to={`/discovery/organize/outcomes/${record.id}`}
          className="text-[var(--primary)] hover:underline line-clamp-2 text-xs"
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
  ], [solutions]);

  // Filter configuration
  const filters: FilterConfig[] = useMemo(() => [
    {
      key: 'solutionId',
      label: 'Solutions',
      type: 'select',
      options: solutions.map((s) => ({ value: s.id, label: s.name })),
      showSearch: true,
    },
  ], [solutions]);

  return (
    <>
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
            {isUnlinkedFilter && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-sm bg-amber-500/5 border border-amber-500/20 text-xs text-[var(--text)]">
                <span>Showing <strong>unlinked outcomes</strong> (not linked to any solution)</span>
                <button
                  type="button"
                  onClick={() => urlState.setFilter('unlinked', '')}
                  className="ml-auto text-[var(--text-muted)] hover:text-[var(--text)] p-0.5 rounded-sm hover:bg-[var(--bg-secondary)] transition-colors"
                  title="Clear filter"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <EntityList
              items={displayData?.items || []}
              loading={displayLoading}
              totalCount={displayData?.totalCount || 0}
              urlState={urlState}
              columns={columns}
              filters={filters}
              searchPlaceholder="Search outcomes..."
              emptyDescription="No outcomes found. Adjust your filters or add new outcomes."
            />
          </>
        )}
      </PageContent>
    </>
  );
}

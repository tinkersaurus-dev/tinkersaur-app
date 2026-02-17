/**
 * Personas List Page
 * Displays all personas in a paginated table with filtering and multi-select
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { FiPlus, FiGitMerge, FiX } from 'react-icons/fi';
import { PageHeader, PageContent, EntityList, Empty } from '@/shared/ui';
import { Button } from '@/shared/ui';
import type { TableColumn, FilterConfig } from '@/shared/ui';
import type { Persona } from '@/entities/persona';
import { usePersonasPaginatedQuery, usePersonasQuery, filterStalePersonas } from '@/entities/persona';
import { useSolutionsQuery } from '@/entities/solution';
import { useListUrlState } from '@/shared/hooks';
import { useAuthStore } from '@/features/auth';
import { PersonaMergeModal } from '@/features/entity-merging';

export default function PersonasListPage() {
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const teamId = selectedTeam?.teamId;

  // URL state for pagination, filters, and sorting
  const urlState = useListUrlState({
    filterKeys: ['solutionId', 'stale'],
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  });

  const staleThreshold = urlState.filters.stale ? parseInt(urlState.filters.stale, 10) : null;
  const isStaleFilter = staleThreshold !== null && staleThreshold > 0;

  // Build query params from URL state (disabled when using stale filter)
  const queryParams = useMemo(() => {
    if (!teamId || isStaleFilter) return null;
    return {
      teamId,
      page: urlState.page,
      pageSize: urlState.pageSize,
      search: urlState.search || undefined,
      solutionId: urlState.filters.solutionId || undefined,
      sortBy: urlState.sortBy || undefined,
      sortOrder: urlState.sortOrder || undefined,
    };
  }, [teamId, isStaleFilter, urlState.page, urlState.pageSize, urlState.search, urlState.filters.solutionId, urlState.sortBy, urlState.sortOrder]);

  // Data fetching
  const { data, isLoading } = usePersonasPaginatedQuery(queryParams);
  const { data: allPersonas = [], isLoading: allPersonasLoading } =
    usePersonasQuery(isStaleFilter ? teamId : undefined);
  const { data: solutions = [] } = useSolutionsQuery(teamId);

  // Client-side filtering for stale personas
  const staleData = useMemo(() => {
    if (!isStaleFilter) return null;
    const filtered = filterStalePersonas(allPersonas, staleThreshold)
      .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    const start = (urlState.page - 1) * urlState.pageSize;
    return {
      items: filtered.slice(start, start + urlState.pageSize),
      totalCount: filtered.length,
    };
  }, [isStaleFilter, staleThreshold, allPersonas, urlState.page, urlState.pageSize]);

  const displayData = isStaleFilter ? staleData : data;
  const displayLoading = isStaleFilter ? allPersonasLoading : isLoading;

  // Merge modal state
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [selectedPersonas, setSelectedPersonas] = useState<Persona[]>([]);
  const [clearSelection, setClearSelection] = useState<(() => void) | null>(null);

  // Table columns (without selection - EntityList adds it)
  const columns: TableColumn<Persona>[] = useMemo(() => [
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
          className="text-[var(--primary)] text-xs hover:underline font-medium"
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
  ], []);

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

  // Handle merge modal close
  const handleMergeModalClose = () => {
    setMergeModalOpen(false);
    clearSelection?.();
  };

  return (
    <>
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
            {isStaleFilter && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-sm bg-amber-500/5 border border-amber-500/20 text-xs text-[var(--text)]">
                <span>Showing <strong>stale personas</strong> (not updated in {staleThreshold}+ days)</span>
                <button
                  type="button"
                  onClick={() => urlState.setFilter('stale', '')}
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
            searchPlaceholder="Search personas..."
            emptyDescription="No personas found. Adjust your filters or create a new persona."
            actions={(selection) =>
              selection.selectedCount >= 2 ? (
                <Button
                  variant="default"
                  icon={<FiGitMerge />}
                  onClick={() => {
                    setSelectedPersonas(selection.selectedItems);
                    setClearSelection(() => selection.clear);
                    setMergeModalOpen(true);
                  }}
                >
                  Merge ({selection.selectedCount})
                </Button>
              ) : null
            }
            />
          </>
        )}
      </PageContent>

      {/* Merge Modal */}
      {teamId && (
        <PersonaMergeModal
          open={mergeModalOpen}
          onClose={handleMergeModalClose}
          selectedPersonas={selectedPersonas}
          teamId={teamId}
        />
      )}
    </>
  );
}

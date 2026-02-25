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
import { usePersonasPaginatedQuery, usePersonasQuery, filterStalePersonas, getDaysSinceLastIntake, getFreshness } from '@/entities/persona';
import { useSolutionStore, useSolutionsQuery } from '@/entities/solution';
import { useListUrlState } from '@/shared/hooks';
import { useAuthStore } from '@/shared/auth';
import { PersonaMergeModal } from '@/features/entity-merging';

function getFreshnessColor(record: Persona): string | null {
  const freshness = getFreshness(record);
  if (!freshness) return null;
  return freshness === 'Fresh' ? 'var(--tag-green)' : freshness === 'Moderate' ? 'var(--tag-amber)' : 'var(--tag-red)';
}

export default function PersonasListPage() {
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const teamId = selectedTeam?.teamId;

  // URL state for pagination, filters, and sorting
  const urlState = useListUrlState({
    filterKeys: ['solutionId', 'stale'],
    defaultSortBy: 'lastintakeat',
    defaultSortOrder: 'asc',
  });

  const contextSolutionId = useSolutionStore((s) => s.selectedSolution?.solutionId);
  const effectiveSolutionId = contextSolutionId || urlState.filters.solutionId || undefined;

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
      solutionId: effectiveSolutionId,
      sortBy: urlState.sortBy || undefined,
      sortOrder: urlState.sortOrder || undefined,
    };
  }, [teamId, isStaleFilter, urlState.page, urlState.pageSize, urlState.search, effectiveSolutionId, urlState.sortBy, urlState.sortOrder]);

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
          className="text-[var(--primary)] text-base hover:underline font-medium"
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
        <span className="text-[var(--text-muted)] text-base">{value as string || '—'}</span>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      dataIndex: 'description',
      sorter: true,
      sortField: 'description',
      render: (value) => (
        <span className="line-clamp-2 text-[var(--text-muted)] text-base">
          {value as string || '—'}
        </span>
      ),
    },
    {
      key: 'lastIntakeDays',
      title: 'Last Intake',
      width: 110,
      sorter: true,
      sortField: 'lastintakeat',
      onCell: (record: Persona) => {
        const color = getFreshnessColor(record);
        const days = getDaysSinceLastIntake(record);
        if (!color || days === null) return {};
        const bgAlpha = 0.2 * (1 / (days / 4 + 1));
        return {
          style: {
            backgroundColor: `oklch(from ${color} l c h / ${bgAlpha})`,
          },
        };
      },
      render: (_, record) => {
        const days = getDaysSinceLastIntake(record);
        const color = getFreshnessColor(record);
        if (days === null || !color) return <span className="text-[var(--text-muted)] text-base">—</span>;
        return (
          <span className="text-base font-semibold tabular-nums" style={{ color }}>
            {`${days}d ago`}
          </span>
        );
      },
    },
    {
      key: 'freshness',
      title: 'Freshness',
      width: 110,
      sorter: true,
      sortField: 'lastintakeat',
      onCell: (record: Persona) => {
        const color = getFreshnessColor(record);
        const days = getDaysSinceLastIntake(record);
        if (!color || days === null) return {};
        const bgAlpha = 0.2 * (1 / (days / 4 + 1));
        return {
          style: {
            backgroundColor: `oklch(from ${color} l c h / ${bgAlpha})`,
          },
        };
      },
      render: (_, record) => {
        const color = getFreshnessColor(record);
        if (!color) return <span className="text-[var(--text-muted)] text-base">—</span>;
        return <span className="text-base font-semibold" style={{ color }}>{getFreshness(record)}</span>;
      },
    },
    {
      key: 'painScore',
      title: 'Pain',
      width: 80,
      sorter: true,
      sortField: 'painscore',
      onCell: (record: Persona) => {
        if (record.painScore <= 0) return {};
        const bgAlpha = 0.05 * record.painScore;
        return {
          style: {
            backgroundColor: `oklch(0.5702 0.0938 338.5 / ${bgAlpha})`,
          },
        };
      },
      render: (_, record) => (
        <span className="text-base font-semibold tabular-nums" style={{ color: 'oklch(0.5702 0.0938 338.5)' }}>
          {record.painScore > 0 ? record.painScore.toFixed(1) : '—'}
        </span>
      ),
    },
  ], []);

  // Filter configuration
  const filters: FilterConfig[] = useMemo(() => [
    ...(!contextSolutionId ? [{
      key: 'solutionId',
      label: 'Solutions',
      type: 'select' as const,
      options: solutions.map((s) => ({ value: s.id, label: s.name })),
      showSearch: true,
    }] : []),
  ], [contextSolutionId, solutions]);

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
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-sm bg-amber-500/5 border border-amber-500/20 text-base text-[var(--text)]">
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

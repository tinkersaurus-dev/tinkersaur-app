/**
 * User Goals List Page
 * Displays all user goals in a paginated table with filtering and multi-select
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { FiPlus, FiGitMerge, FiX } from 'react-icons/fi';
import { PageHeader, PageContent, EntityList, Empty } from '@/shared/ui';
import { Button } from '@/shared/ui';
import type { TableColumn, FilterConfig } from '@/shared/ui';
import type { UserGoal } from '@/entities/user-goal';
import { useUserGoalsPaginatedQuery, useUserGoalsByTeamQuery, filterWeakEvidenceUserGoals, getEvidenceCount, getEvidenceStrength, getDaysSinceLastIntake, getFreshness } from '@/entities/user-goal';
import { usePersonasQuery } from '@/entities/persona';
import { useSolutionStore, useSolutionsQuery } from '@/entities/solution';
import { useListUrlState } from '@/shared/hooks';
import { useAuthStore } from '@/shared/auth';
import { UserGoalMergeModal } from '@/features/entity-merging';
import { CreateUserGoalModal } from '@/features/user-goal-management';

function getFreshnessColor(record: UserGoal): string | null {
  const freshness = getFreshness(record);
  if (!freshness) return null;
  return freshness === 'Fresh' ? 'var(--tag-green)' : freshness === 'Moderate' ? 'var(--tag-amber)' : 'var(--tag-red)';
}

function getEvidenceColor(record: UserGoal): string {
  const strength = getEvidenceStrength(record);
  return strength === 'Strong' ? 'var(--tag-green)' : strength === 'Evident' ? 'var(--tag-blue)' : 'var(--tag-amber)';
}

export default function UserGoalsListPage() {
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const teamId = selectedTeam?.teamId;

  // URL state for pagination, filters, and sorting
  const urlState = useListUrlState({
    filterKeys: ['solutionId', 'personaIds', 'weakEvidence'],
    defaultSortBy: 'lastintakeat',
    defaultSortOrder: 'asc',
  });

  const contextSolutionId = useSolutionStore((s) => s.selectedSolution?.solutionId);
  const effectiveSolutionId = contextSolutionId || urlState.filters.solutionId || undefined;

  const isWeakEvidenceFilter = urlState.filters.weakEvidence === 'true';

  // Parse personaIds from URL (comma-separated) for API query
  const personaIds = useMemo(() => {
    const ids = urlState.filters.personaIds;
    if (!ids) return undefined;
    return ids.split(',').filter(Boolean);
  }, [urlState.filters.personaIds]);

  // Build query params from URL state (disabled when using weak evidence filter)
  const queryParams = useMemo(() => {
    if (!teamId || isWeakEvidenceFilter) return null;
    return {
      teamId,
      page: urlState.page,
      pageSize: urlState.pageSize,
      search: urlState.search || undefined,
      solutionId: effectiveSolutionId,
      personaIds,
      sortBy: urlState.sortBy || undefined,
      sortOrder: urlState.sortOrder || undefined,
    };
  }, [teamId, isWeakEvidenceFilter, urlState.page, urlState.pageSize, urlState.search, effectiveSolutionId, personaIds, urlState.sortBy, urlState.sortOrder]);

  // Data fetching
  const { data, isLoading } = useUserGoalsPaginatedQuery(queryParams);
  const { data: allUserGoals = [], isLoading: allUserGoalsLoading } =
    useUserGoalsByTeamQuery(isWeakEvidenceFilter ? teamId : undefined);
  const { data: personas = [] } = usePersonasQuery(teamId);
  const { data: solutions = [] } = useSolutionsQuery(teamId);

  // Client-side filtering for weak evidence user goals
  const weakEvidenceData = useMemo(() => {
    if (!isWeakEvidenceFilter) return null;
    const filtered = filterWeakEvidenceUserGoals(allUserGoals);
    const start = (urlState.page - 1) * urlState.pageSize;
    return {
      items: filtered.slice(start, start + urlState.pageSize),
      totalCount: filtered.length,
    };
  }, [isWeakEvidenceFilter, allUserGoals, urlState.page, urlState.pageSize]);

  const displayData = isWeakEvidenceFilter ? weakEvidenceData : data;
  const displayLoading = isWeakEvidenceFilter ? allUserGoalsLoading : isLoading;

  // Modal state
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserGoals, setSelectedUserGoals] = useState<UserGoal[]>([]);
  const [clearSelection, setClearSelection] = useState<(() => void) | null>(null);

  // Table columns (without selection - EntityList adds it)
  const columns: TableColumn<UserGoal>[] = useMemo(() => [
    {
      key: 'name',
      title: 'Name',
      dataIndex: 'name',
      sorter: true,
      sortField: 'name',
      render: (_, record) => (
        <Link
          to={`/discovery/organize/user-goals/${record.id}`}
          className="text-[var(--primary)] text-base hover:underline font-medium"
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
      onCell: (record: UserGoal) => {
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
      onCell: (record: UserGoal) => {
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
      key: 'evidenceScore',
      title: 'Evidence',
      width: 100,
      sorter: true,
      sortField: 'evidencecount',
      onCell: (record: UserGoal) => {
        const count = getEvidenceCount(record);
        if (count <= 0) return {};
        const color = getEvidenceColor(record);
        const bgAlpha = 0.2 * (count / (count + 4));
        return {
          style: {
            backgroundColor: `oklch(from ${color} l c h / ${bgAlpha})`,
          },
        };
      },
      render: (_, record) => {
        const count = getEvidenceCount(record);
        const color = getEvidenceColor(record);
        return (
          <span className="text-base font-semibold tabular-nums" style={{ color }}>
            {count > 0 ? count : '—'}
          </span>
        );
      },
    },
    {
      key: 'evidenceStrength',
      title: 'Strength',
      width: 100,
      sorter: true,
      sortField: 'evidencecount',
      onCell: (record: UserGoal) => {
        const count = getEvidenceCount(record);
        if (count <= 0) return {};
        const color = getEvidenceColor(record);
        const bgAlpha = 0.2 * (count / (count + 4));
        return {
          style: {
            backgroundColor: `oklch(from ${color} l c h / ${bgAlpha})`,
          },
        };
      },
      render: (_, record) => {
        const color = getEvidenceColor(record);
        return <span className="text-base font-semibold" style={{ color }}>{getEvidenceStrength(record)}</span>;
      },
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
    {
      key: 'personaIds',
      label: 'Personas',
      type: 'multiselect',
      options: personas.map((p) => ({ value: p.id, label: p.name })),
      showSearch: true,
    },
  ], [contextSolutionId, solutions, personas]);

  // Handle merge modal close
  const handleMergeModalClose = () => {
    setIsMergeModalOpen(false);
    clearSelection?.();
  };

  return (
    <>
      <PageHeader
        title="User Goals"
        actions={
          <Button
            variant="primary"
            icon={<FiPlus />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Add User Goal
          </Button>
        }
      />

      <PageContent>
        {!teamId ? (
          <Empty description="No team selected. Please create an organization and team first." />
        ) : (
          <>
            {isWeakEvidenceFilter && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-sm bg-amber-500/5 border border-amber-500/20 text-xs text-[var(--text)]">
                <span>Showing user goals with <strong>weak evidence</strong> (fewer than 3 linked personas and feedback)</span>
                <button
                  type="button"
                  onClick={() => urlState.setFilter('weakEvidence', '')}
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
            multiSelectFilterKeys={['personaIds']}
            searchPlaceholder="Search user goals..."
            emptyDescription="No user goals found. Adjust your filters or create a new user goal."
            actions={(selection) =>
              selection.selectedCount >= 2 ? (
                <Button
                  variant="default"
                  size="small"
                  icon={<FiGitMerge />}
                  onClick={() => {
                    setSelectedUserGoals(selection.selectedItems);
                    setClearSelection(() => selection.clear);
                    setIsMergeModalOpen(true);
                  }}
                >
                  Merge Selected
                </Button>
              ) : null
            }
            />
          </>
        )}
      </PageContent>

      {/* Merge Modal */}
      {teamId && (
        <UserGoalMergeModal
          open={isMergeModalOpen}
          onClose={handleMergeModalClose}
          selectedUserGoals={selectedUserGoals}
          teamId={teamId}
        />
      )}

      {/* Create Modal */}
      {teamId && (
        <CreateUserGoalModal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          teamId={teamId}
        />
      )}
    </>
  );
}

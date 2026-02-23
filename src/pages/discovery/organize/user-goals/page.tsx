/**
 * User Goals List Page
 * Displays all user goals in a paginated table with filtering and multi-select
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { FiPlus, FiGitMerge, FiX } from 'react-icons/fi';
import { PageHeader, PageContent, EntityList, Empty, Tag } from '@/shared/ui';
import { Button } from '@/shared/ui';
import type { TableColumn, FilterConfig } from '@/shared/ui';
import type { UserGoal } from '@/entities/user-goal';
import { useUserGoalsPaginatedQuery, useUserGoalsByTeamQuery, filterWeakEvidenceUserGoals, getEvidenceCount, getEvidenceStrength } from '@/entities/user-goal';
import { usePersonasQuery } from '@/entities/persona';
import { useListUrlState } from '@/shared/hooks';
import { useAuthStore } from '@/features/auth';
import { UserGoalMergeModal } from '@/features/entity-merging';
import { CreateUserGoalModal } from '@/features/user-goal-management';

export default function UserGoalsListPage() {
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const teamId = selectedTeam?.teamId;

  // URL state for pagination, filters, and sorting
  const urlState = useListUrlState({
    filterKeys: ['personaIds', 'weakEvidence'],
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  });

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
      personaIds,
      sortBy: urlState.sortBy || undefined,
      sortOrder: urlState.sortOrder || undefined,
    };
  }, [teamId, isWeakEvidenceFilter, urlState.page, urlState.pageSize, urlState.search, personaIds, urlState.sortBy, urlState.sortOrder]);

  // Data fetching
  const { data, isLoading } = useUserGoalsPaginatedQuery(queryParams);
  const { data: allUserGoals = [], isLoading: allUserGoalsLoading } =
    useUserGoalsByTeamQuery(isWeakEvidenceFilter ? teamId : undefined);
  const { data: personas = [] } = usePersonasQuery(teamId);

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
      key: 'personaCount',
      title: 'Personas',
      dataIndex: 'personaCount',
      width: 100,
      sorter: true,
      sortField: 'personacount',
      render: (value) => (
        <span className="text-[var(--text-muted)] text-base tabular-nums">{value as number}</span>
      ),
    },
    {
      key: 'problemCount',
      title: 'Problems',
      dataIndex: 'problemCount',
      width: 100,
      sorter: true,
      sortField: 'problemcount',
      render: (value) => (
        <span className="text-[var(--text-muted)] text-base tabular-nums">{value as number}</span>
      ),
    },
    {
      key: 'suggestionCount',
      title: 'Suggestions',
      dataIndex: 'suggestionCount',
      width: 100,
      sorter: true,
      sortField: 'suggestioncount',
      render: (value) => (
        <span className="text-[var(--text-muted)] text-base tabular-nums">{value as number}</span>
      ),
    },
    {
      key: 'otherFeedbackCount',
      title: 'Other',
      dataIndex: 'otherFeedbackCount',
      width: 100,
      sorter: true,
      sortField: 'otherfeedbackcount',
      render: (value) => (
        <span className="text-[var(--text-muted)] text-base tabular-nums">{value as number}</span>
      ),
    },
    {
      key: 'sourceCount',
      title: 'Sources',
      dataIndex: 'sourceCount',
      width: 100,
      sorter: true,
      sortField: 'sourcecount',
      render: (value) => (
        <span className="text-[var(--text-muted)] text-base tabular-nums">{value as number}</span>
      ),
    },
    {
      key: 'evidenceScore',
      title: 'Evidence',
      width: 100,
      sorter: true,
      sortField: 'evidencecount',
      render: (_, record) => (
        <span className="text-[var(--text-muted)] text-base tabular-nums">
          {getEvidenceCount(record)}
        </span>
      ),
    },
    {
      key: 'evidenceStrength',
      title: 'Strength',
      width: 100,
      sorter: true,
      sortField: 'evidencecount',
      render: (_, record) => {
        const strength = getEvidenceStrength(record);
        const color = strength === 'Strong' ? 'green' : strength === 'Evident' ? 'blue' : 'amber';
        return <Tag color={color}>{strength}</Tag>;
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
        <span className="text-[var(--text-muted)] text-base">
          {new Date(value as Date).toLocaleDateString()}
        </span>
      ),
    },
  ], []);

  // Filter configuration
  const filters: FilterConfig[] = useMemo(() => [
    {
      key: 'personaIds',
      label: 'Personas',
      type: 'multiselect',
      options: personas.map((p) => ({ value: p.id, label: p.name })),
      showSearch: true,
    },
  ], [personas]);

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

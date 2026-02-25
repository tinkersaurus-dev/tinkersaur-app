/**
 * Feedback List Page
 * Displays all feedback in a paginated table with filtering and multi-select
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { FiPlus, FiGitMerge, FiX } from 'react-icons/fi';
import { PageHeader, PageContent, EntityList, Empty } from '@/shared/ui';
import { Button, Tag } from '@/shared/ui';
import type { TableColumn, FilterConfig, TagColor } from '@/shared/ui';
import type { Feedback } from '@/entities/feedback';
import { FEEDBACK_TYPE_CONFIG, isUnlinkedFeedback } from '@/entities/feedback';
import { useFeedbacksPaginatedQuery, useFeedbacksQuery } from '@/entities/feedback';
import { useSolutionStore, useSolutionsQuery } from '@/entities/solution';
import { usePersonasQuery } from '@/entities/persona';
import { useUserGoalsByTeamQuery } from '@/entities/user-goal';
import { useListUrlState } from '@/shared/hooks';
import { useAuthStore } from '@/shared/auth';
import { FeedbackMergeModal } from '@/features/entity-merging';
import { GroupFeedbackButton, GroupingPreviewModal } from '@/features/feedback-grouping';

export default function FeedbackListPage() {
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const teamId = selectedTeam?.teamId;

  // URL state for pagination, filters, and sorting
  const urlState = useListUrlState({
    filterKeys: ['solutionId', 'personaIds', 'userGoalIds', 'unlinked'],
    defaultSortBy: 'weight',
    defaultSortOrder: 'desc',
  });

  const contextSolutionId = useSolutionStore((s) => s.selectedSolution?.solutionId);
  const effectiveSolutionId = contextSolutionId || urlState.filters.solutionId || undefined;

  const isUnlinkedFilter = urlState.filters.unlinked === 'true';

  // Parse multi-select IDs from URL (comma-separated) for API query
  const personaIds = useMemo(() => {
    const ids = urlState.filters.personaIds;
    if (!ids) return undefined;
    return ids.split(',').filter(Boolean);
  }, [urlState.filters.personaIds]);

  const userGoalIds = useMemo(() => {
    const ids = urlState.filters.userGoalIds;
    if (!ids) return undefined;
    return ids.split(',').filter(Boolean);
  }, [urlState.filters.userGoalIds]);

  // Build query params from URL state (disabled when using unlinked filter)
  const queryParams = useMemo(() => {
    if (!teamId || isUnlinkedFilter) return null;
    return {
      teamId,
      page: urlState.page,
      pageSize: urlState.pageSize,
      search: urlState.search || undefined,
      solutionId: effectiveSolutionId,
      personaIds,
      userGoalIds,
      sortBy: urlState.sortBy || undefined,
      sortOrder: urlState.sortOrder || undefined,
    };
  }, [teamId, isUnlinkedFilter, urlState.page, urlState.pageSize, urlState.search, effectiveSolutionId, personaIds, userGoalIds, urlState.sortBy, urlState.sortOrder]);

  // Data fetching — use non-paginated query when unlinked filter is active
  const { data, isLoading } = useFeedbacksPaginatedQuery(queryParams);
  const { data: allFeedbacks = [], isLoading: allFeedbacksLoading } =
    useFeedbacksQuery(isUnlinkedFilter ? teamId : undefined);

  // Client-side filtering for unlinked feedback
  const unlinkedData = useMemo(() => {
    if (!isUnlinkedFilter) return null;
    const filtered = allFeedbacks.filter(isUnlinkedFeedback);
    const start = (urlState.page - 1) * urlState.pageSize;
    return {
      items: filtered.slice(start, start + urlState.pageSize),
      totalCount: filtered.length,
    };
  }, [isUnlinkedFilter, allFeedbacks, urlState.page, urlState.pageSize]);

  const displayData = isUnlinkedFilter ? unlinkedData : data;
  const displayLoading = isUnlinkedFilter ? allFeedbacksLoading : isLoading;
  const { data: solutions = [] } = useSolutionsQuery(teamId);
  const { data: personas = [] } = usePersonasQuery(teamId);
  const { data: userGoals = [] } = useUserGoalsByTeamQuery(teamId);

  // Merge modal state
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [selectedFeedbacks, setSelectedFeedbacks] = useState<Feedback[]>([]);
  const [clearSelection, setClearSelection] = useState<(() => void) | null>(null);

  // Grouping modal state
  const [groupingModalOpen, setGroupingModalOpen] = useState(false);

  // Map feedback type to tag color
  const getTypeColor = (type: string): TagColor => {
    const config = FEEDBACK_TYPE_CONFIG[type as keyof typeof FEEDBACK_TYPE_CONFIG];
    return (config?.color || 'default') as TagColor;
  };

  // Table columns (without selection - EntityList adds it)
  const columns: TableColumn<Feedback>[] = useMemo(() => [
    {
      key: 'type',
      title: 'Type',
      dataIndex: 'type',
      width: 100,
      sorter: true,
      sortField: 'type',
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
      sorter: true,
      sortField: 'content',
      render: (_, record) => (
        <Link
          to={`/discovery/organize/feedback/${record.id}`}
          className="text-[var(--primary)] hover:underline line-clamp-2 text-base"
        >
          {record.content}
        </Link>
      ),
    },
    {
      key: 'weight',
      title: 'Weight',
      dataIndex: 'weight',
      width: 80,
      sorter: true,
      sortField: 'weight',
      render: (value) => {
        const weight = value as number;
        if (!weight || weight === 0) return null;
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-base font-medium bg-[var(--primary)]/10 text-[var(--primary)]">
            +{weight}
          </span>
        );
      },
    },
    {
      key: 'solution',
      title: 'Solution',
      dataIndex: 'solutionId',
      width: 150,
      sorter: true,
      sortField: 'solutionId',
      render: (value) => {
        if (!value) return <span className="text-[var(--text-muted)] text-base">—</span>;
        const solution = solutions.find(s => s.id === value);
        return (
          <span className="text-[var(--text-muted)] text-base">
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
        <span className="text-[var(--text-muted)] text-base">
          {new Date(value as Date).toLocaleDateString()}
        </span>
      ),
    },
  ], [solutions]);

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
    {
      key: 'userGoalIds',
      label: 'User Goals',
      type: 'multiselect',
      options: userGoals.map((ug) => ({ value: ug.id, label: ug.name })),
      showSearch: true,
    },
  ], [contextSolutionId, solutions, personas, userGoals]);

  // Handle merge modal close
  const handleMergeModalClose = () => {
    setMergeModalOpen(false);
    clearSelection?.();
  };

  return (
    <>
      <PageHeader
        title="Feedback"
        actions={
          <div className="flex gap-2">
            <GroupFeedbackButton onClick={() => setGroupingModalOpen(true)} />
            <Button
              variant="primary"
              icon={<FiPlus />}
              onClick={() => {/* TODO: Add modal */}}
            >
              Add Feedback
            </Button>
          </div>
        }
      />

      <PageContent>
        {!teamId ? (
          <Empty description="No team selected. Please create an organization and team first." />
        ) : (
          <>
            {isUnlinkedFilter && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-sm bg-amber-500/5 border border-amber-500/20 text-xs text-[var(--text)]">
                <span>Showing <strong>unlinked feedback</strong> only (not linked to any persona)</span>
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
              multiSelectFilterKeys={['personaIds', 'userGoalIds']}
              searchPlaceholder="Search feedback..."
              emptyDescription="No feedback found. Adjust your filters or add new feedback."
              actions={(selection) =>
                selection.selectedCount >= 2 ? (
                  <Button
                    variant="default"
                    icon={<FiGitMerge />}
                    onClick={() => {
                      setSelectedFeedbacks(selection.selectedItems);
                      setClearSelection(() => selection.clear);
                      setMergeModalOpen(true);
                    }}
                  >
                    Merge ({selection.selectedCount})
                  </Button>
                ) : null
              }
            />

            {/* Merge Modal */}
            {teamId && (
              <FeedbackMergeModal
                open={mergeModalOpen}
                onClose={handleMergeModalClose}
                selectedFeedbacks={selectedFeedbacks}
                teamId={teamId}
              />
            )}

            {/* Grouping Modal */}
            {teamId && (
              <GroupingPreviewModal
                open={groupingModalOpen}
                onClose={() => setGroupingModalOpen(false)}
                teamId={teamId}
                solutionId={effectiveSolutionId}
              />
            )}
          </>
        )}
      </PageContent>
    </>
  );
}

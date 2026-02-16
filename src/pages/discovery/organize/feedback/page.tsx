/**
 * Feedback List Page
 * Displays all feedback in a paginated table with filtering and multi-select
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { FiPlus, FiGitMerge } from 'react-icons/fi';
import { PageHeader, PageContent, EntityList, Empty } from '@/shared/ui';
import { Button, Tag } from '@/shared/ui';
import type { TableColumn, FilterConfig, TagColor } from '@/shared/ui';
import type { Feedback } from '@/entities/feedback';
import { FEEDBACK_TYPE_CONFIG } from '@/entities/feedback';
import { useFeedbacksPaginatedQuery } from '@/entities/feedback';
import { useSolutionsQuery } from '@/entities/solution';
import { usePersonasQuery } from '@/entities/persona';
import { useUseCasesByTeamQuery } from '@/entities/use-case';
import { useListUrlState } from '@/shared/hooks';
import { useAuthStore } from '@/features/auth';
import { FeedbackMergeModal } from '@/features/entity-merging';
import { GroupFeedbackButton, GroupingPreviewModal } from '@/features/feedback-grouping';

export default function FeedbackListPage() {
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const teamId = selectedTeam?.teamId;

  // URL state for pagination, filters, and sorting
  const urlState = useListUrlState({
    filterKeys: ['solutionId', 'personaIds', 'useCaseIds'],
    defaultSortBy: 'weight',
    defaultSortOrder: 'desc',
  });

  // Parse multi-select IDs from URL (comma-separated) for API query
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
      sortBy: urlState.sortBy || undefined,
      sortOrder: urlState.sortOrder || undefined,
    };
  }, [teamId, urlState.page, urlState.pageSize, urlState.search, urlState.filters.solutionId, personaIds, useCaseIds, urlState.sortBy, urlState.sortOrder]);

  // Data fetching
  const { data, isLoading } = useFeedbacksPaginatedQuery(queryParams);
  const { data: solutions = [] } = useSolutionsQuery(teamId);
  const { data: personas = [] } = usePersonasQuery(teamId);
  const { data: useCases = [] } = useUseCasesByTeamQuery(teamId);

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
          className="text-[var(--primary)] hover:underline line-clamp-2 text-xs"
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
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)]">
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
    {
      key: 'personaIds',
      label: 'Personas',
      type: 'multiselect',
      options: personas.map((p) => ({ value: p.id, label: p.name })),
      showSearch: true,
    },
    {
      key: 'useCaseIds',
      label: 'Use Cases',
      type: 'multiselect',
      options: useCases.map((uc) => ({ value: uc.id, label: uc.name })),
      showSearch: true,
    },
  ], [solutions, personas, useCases]);

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
            <EntityList
              items={data?.items || []}
              loading={isLoading}
              totalCount={data?.totalCount || 0}
              urlState={urlState}
              columns={columns}
              filters={filters}
              multiSelectFilterKeys={['personaIds', 'useCaseIds']}
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
                solutionId={urlState.filters.solutionId || undefined}
              />
            )}
          </>
        )}
      </PageContent>
    </>
  );
}

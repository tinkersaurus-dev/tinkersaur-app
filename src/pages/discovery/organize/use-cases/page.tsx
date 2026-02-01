/**
 * Use Cases List Page
 * Displays all use cases in a paginated table with filtering and multi-select
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { FiPlus, FiGitMerge } from 'react-icons/fi';
import { PageHeader, PageContent, EntityList, Empty } from '@/shared/ui';
import { MainLayout } from '@/app/layouts/MainLayout';
import { Button } from '@/shared/ui';
import type { TableColumn, FilterConfig } from '@/shared/ui';
import type { UseCase } from '@/entities/use-case';
import { useUseCasesPaginatedQuery } from '@/entities/use-case';
import { useSolutionsQuery } from '@/entities/solution';
import { usePersonasQuery } from '@/entities/persona';
import { useListUrlState } from '@/shared/hooks';
import { useAuthStore } from '@/features/auth';
import { UseCaseMergeModal } from '@/features/entity-merging';
import { CreateUseCaseModal } from '@/features/use-case-management';

export default function UseCasesListPage() {
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const teamId = selectedTeam?.teamId;

  // URL state for pagination, filters, and sorting
  const urlState = useListUrlState({
    filterKeys: ['solutionId', 'personaIds'],
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  });

  // Parse personaIds from URL (comma-separated) for API query
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

  // Modal state
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUseCases, setSelectedUseCases] = useState<UseCase[]>([]);
  const [clearSelection, setClearSelection] = useState<(() => void) | null>(null);

  // Table columns (without selection - EntityList adds it)
  const columns: TableColumn<UseCase>[] = useMemo(() => [
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
  ], [solutions, personas]);

  // Handle merge modal close
  const handleMergeModalClose = () => {
    setIsMergeModalOpen(false);
    clearSelection?.();
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
          <EntityList
            items={data?.items || []}
            loading={isLoading}
            totalCount={data?.totalCount || 0}
            urlState={urlState}
            columns={columns}
            filters={filters}
            multiSelectFilterKeys={['personaIds']}
            searchPlaceholder="Search use cases..."
            emptyDescription="No use cases found. Adjust your filters or create a new use case."
            actions={(selection) =>
              selection.selectedCount >= 2 ? (
                <Button
                  variant="default"
                  size="small"
                  icon={<FiGitMerge />}
                  onClick={() => {
                    setSelectedUseCases(selection.selectedItems);
                    setClearSelection(() => selection.clear);
                    setIsMergeModalOpen(true);
                  }}
                >
                  Merge Selected
                </Button>
              ) : null
            }
          />
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

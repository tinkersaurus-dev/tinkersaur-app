/**
 * Personas List Page
 * Displays all personas in a paginated table with filtering and multi-select
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { FiPlus, FiGitMerge } from 'react-icons/fi';
import { PageHeader, PageContent, EntityList, Empty } from '@/shared/ui';
import { Button } from '@/shared/ui';
import type { TableColumn, FilterConfig } from '@/shared/ui';
import type { Persona } from '@/entities/persona';
import { usePersonasPaginatedQuery } from '@/entities/persona';
import { useSolutionsQuery } from '@/entities/solution';
import { useListUrlState } from '@/shared/hooks';
import { useAuthStore } from '@/features/auth';
import { PersonaMergeModal } from '@/features/entity-merging';

export default function PersonasListPage() {
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const teamId = selectedTeam?.teamId;

  // URL state for pagination, filters, and sorting
  const urlState = useListUrlState({
    filterKeys: ['solutionId'],
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  });

  // Build query params from URL state
  const queryParams = useMemo(() => {
    if (!teamId) return null;
    return {
      teamId,
      page: urlState.page,
      pageSize: urlState.pageSize,
      search: urlState.search || undefined,
      solutionId: urlState.filters.solutionId || undefined,
      sortBy: urlState.sortBy || undefined,
      sortOrder: urlState.sortOrder || undefined,
    };
  }, [teamId, urlState.page, urlState.pageSize, urlState.search, urlState.filters.solutionId, urlState.sortBy, urlState.sortOrder]);

  // Data fetching
  const { data, isLoading } = usePersonasPaginatedQuery(queryParams);
  const { data: solutions = [] } = useSolutionsQuery(teamId);

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
          <EntityList
            items={data?.items || []}
            loading={isLoading}
            totalCount={data?.totalCount || 0}
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

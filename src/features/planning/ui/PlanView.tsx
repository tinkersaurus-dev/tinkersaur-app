/**
 * PlanView - Main container for the planning view
 * Displays versions with drag-drop prioritization and epics/stories management
 */

import { useCallback, useMemo, useState } from 'react';
import { FiDownload, FiInfo, FiAlertCircle, FiLoader } from 'react-icons/fi';
import { Button, Card, Empty, HStack } from '@/shared/ui';
import { useSolutionStore } from '@/app/model/stores/solution';
import { usePlanningVersionsQuery } from '../model/usePlanningQueries';
import {
  useUpdatePlanningPriorities,
  useExportPlanning,
} from '../api/usePlanningMutations';
import type { PlanningVersion, VersionPriorityItem } from '@/entities/planning';
import { calculateVersionPoints, countVersionStories } from '@/entities/planning';
import { VersionPriorityPanel } from './VersionPriorityPanel';
import { EpicsStoriesPanel } from './EpicsStoriesPanel';
import { ExportDialog } from './ExportDialog';
import {
  useCollaborationConnection,
  useCollaborationEvents,
  useJoinContext,
  PresenceIndicator,
} from '@/features/collaboration';

export function PlanView() {
  const selectedSolution = useSolutionStore((state) => state.selectedSolution);
  const solutionId = selectedSolution?.solutionId;

  // Queries
  const {
    data: versions,
    isLoading,
    error,
    refetch,
  } = usePlanningVersionsQuery(solutionId);

  // Collaboration - connect and handle events
  useCollaborationConnection();
  useCollaborationEvents();
  useJoinContext('solution', solutionId);

  // Mutations
  const updatePrioritiesMutation = useUpdatePlanningPriorities();
  const exportMutation = useExportPlanning();

  // Local state for optimistic updates during drag-drop
  const [optimisticOrder, setOptimisticOrder] = useState<PlanningVersion[] | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Sort versions by priority (null values go last)
  const sortedVersions = useMemo(() => {
    if (!versions) return [];
    return [...versions].sort((a, b) => {
      if (a.planningPriority === null && b.planningPriority === null) return 0;
      if (a.planningPriority === null) return 1;
      if (b.planningPriority === null) return -1;
      return a.planningPriority - b.planningPriority;
    });
  }, [versions]);

  // Use optimistic order during drag-drop, otherwise use sorted versions from query
  const localVersions = optimisticOrder ?? sortedVersions;

  // Handle version reorder
  const handleReorder = useCallback(
    async (newOrder: PlanningVersion[]) => {
      if (!solutionId) return;

      // Update local state immediately for optimistic UI
      setOptimisticOrder(newOrder);

      // Create priorities array
      const priorities: VersionPriorityItem[] = newOrder.map((v, idx) => ({
        versionId: v.id,
        priority: idx + 1,
      }));

      try {
        await updatePrioritiesMutation.mutateAsync({ solutionId, priorities });
        // Clear optimistic state after successful mutation (query will refetch)
        setOptimisticOrder(null);
      } catch {
        // Revert on error - clear optimistic state and refetch from server
        setOptimisticOrder(null);
        refetch();
      }
    },
    [solutionId, updatePrioritiesMutation, refetch]
  );

  // Handle export
  const handleExport = useCallback(
    async (format: 'json' | 'csv' | 'jira', includeAC: boolean, includePoints: boolean) => {
      if (!solutionId) return;

      await exportMutation.mutateAsync({
        solutionId,
        format,
        includeAcceptanceCriteria: includeAC,
        includeStoryPoints: includePoints,
      });

      setExportDialogOpen(false);
    },
    [solutionId, exportMutation]
  );

  // Calculate totals
  const totals = useMemo(() => {
    if (!localVersions.length) return { versions: 0, stories: 0, points: 0 };

    return {
      versions: localVersions.length,
      stories: localVersions.reduce((sum, v) => sum + countVersionStories(v), 0),
      points: localVersions.reduce((sum, v) => sum + calculateVersionPoints(v), 0),
    };
  }, [localVersions]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <FiLoader className="animate-spin text-[var(--primary)]" size={32} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <FiAlertCircle className="text-red-500 mb-4" size={48} />
        <p className="text-[var(--text-muted)]">Failed to load planning data</p>
        <Button variant="default" onClick={() => refetch()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  // No solution selected
  if (!solutionId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Empty description="Select a solution from the sidebar to view planning data" />
      </div>
    );
  }

  // No versions
  if (!localVersions.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <Empty description="No use case versions found for this solution. Create use cases and versions to start planning." />
      </div>
    );
  }

  return (
    <div className="h-full max-h-full overflow-hidden flex flex-col">
      <div className="grid grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Left Panel: Version Prioritization */}
        <div className="col-span-4 flex flex-col min-h-0">
          <Card shadow={false} className="flex-1 flex flex-col min-h-0" contentClassName="p-0 flex flex-col flex-1 min-h-0">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--border-muted)] bg-[var(--bg)] flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-[var(--text)]">
                  Version Prioritization
                </h3>
                <FiInfo
                  size={14}
                  className="text-[var(--text-muted)]"
                  title="Drag to reorder priority"
                />
              </div>
            </div>

            {/* Version List */}
            <VersionPriorityPanel
              versions={localVersions}
              onReorder={handleReorder}
              onRefetch={refetch}
            />
          </Card>
        </div>

        {/* Right Panel: Epics & Stories */}
        <div className="col-span-8 flex flex-col min-h-0">
          <Card shadow={false} className="flex-1 flex flex-col min-h-0" contentClassName="p-0 flex flex-col flex-1 min-h-0">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--border-muted)] bg-[var(--bg)] flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--text)]">
                  Epics & User Stories
                </h3>
                <HStack gap="md">
                  {solutionId && (
                    <PresenceIndicator contextType="solution" contextId={solutionId} />
                  )}
                  <Button
                    variant="default"
                    size="small"
                    icon={<FiDownload />}
                    onClick={() => setExportDialogOpen(true)}
                    disabled={totals.stories === 0}
                  >
                    Export
                  </Button>
                </HStack>
              </div>
            </div>

            {/* Epics List */}
            <EpicsStoriesPanel versions={localVersions} onRefetch={refetch} />

            {/* Summary Footer */}
            <div className="px-4 py-3 border-t border-[var(--border-muted)] bg-[var(--bg)] flex-shrink-0">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">
                  {totals.versions} versions
                </span>
                <div className="flex items-center gap-4 text-[var(--text)]">
                  <span>{totals.stories} stories</span>
                  <span className="font-semibold">{totals.points} points</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExport}
        isLoading={exportMutation.isPending}
      />
    </div>
  );
}

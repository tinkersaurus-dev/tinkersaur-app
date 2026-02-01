/**
 * VersionPriorityPanel - Left panel for drag-drop version prioritization
 */

import { useCallback, useState } from 'react';
import { FiMove, FiLayers, FiFileText, FiPlus, FiLoader } from 'react-icons/fi';
import { Button, Tag } from '@/shared/ui';
import { useAuthStore } from '@/features/auth';
import type {
  PlanningVersion,
  GenerateEpicsStoriesRequest,
} from '@/entities/planning';
import { useGenerateEpicsStories } from '../api/usePlanningMutations';
import { useCaseVersionApi } from '@/entities/use-case-version';

interface VersionPriorityPanelProps {
  versions: PlanningVersion[];
  onReorder: (newOrder: PlanningVersion[]) => void;
  onRefetch: () => void;
}

export function VersionPriorityPanel({
  versions,
  onReorder,
  onRefetch,
}: VersionPriorityPanelProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());

  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const generateMutation = useGenerateEpicsStories();

  const getStatusColor = (status: string): 'default' | 'blue' | 'green' | 'orange' | 'red' => {
    switch (status) {
      case 'Approved':
        return 'green';
      case 'InReview':
        return 'blue';
      case 'Draft':
        return 'default';
      case 'Rejected':
        return 'red';
      case 'Archived':
        return 'orange';
      default:
        return 'default';
    }
  };

  const handleDragStart = useCallback((id: string) => {
    setDraggedId(id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
  }, []);

  const handleDrop = useCallback(
    (targetId: string) => {
      if (!draggedId || draggedId === targetId) return;

      const draggedIdx = versions.findIndex((v) => v.id === draggedId);
      const targetIdx = versions.findIndex((v) => v.id === targetId);

      if (draggedIdx === -1 || targetIdx === -1) return;

      const newVersions = [...versions];
      const [removed] = newVersions.splice(draggedIdx, 1);
      newVersions.splice(targetIdx, 0, removed);

      onReorder(newVersions);
    },
    [draggedId, versions, onReorder]
  );

  const handleGenerate = useCallback(
    async (version: PlanningVersion) => {
      if (!selectedTeam?.teamId) return;

      setGeneratingIds((prev) => new Set(prev).add(version.id));

      try {
        // Fetch compiled specification for the version
        const versionDetail = await useCaseVersionApi.getWithSnapshot(
          version.useCaseId,
          version.id
        );

        const request: GenerateEpicsStoriesRequest = {
          versionId: version.id,
          compiledSpecification: versionDetail.compiledSpecification || '',
          useCaseName: version.useCaseName,
          versionName: version.versionName,
        };

        await generateMutation.mutateAsync({ teamId: selectedTeam.teamId, request });
        onRefetch();
      } finally {
        setGeneratingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(version.id);
          return newSet;
        });
      }
    },
    [generateMutation, onRefetch, selectedTeam?.teamId]
  );

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-2">
      {versions.map((version, index) => {
        const hasEpics = version.epics.length > 0;
        const totalStories = version.epics.reduce((sum, e) => sum + e.stories.length, 0);
        const isGenerating = generatingIds.has(version.id);

        return (
          <div
            key={version.id}
            draggable={!isGenerating}
            onDragStart={() => handleDragStart(version.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(version.id)}
            className={`
              mb-2 px-3 py-2 rounded border cursor-grab active:cursor-grabbing
              transition-all duration-150
              border-[var(--border-muted)] bg-[var(--bg-light)]
              ${draggedId === version.id ? 'opacity-50 scale-95' : ''}
              ${isGenerating ? 'cursor-wait' : ''}
              hover:border-[var(--primary)]
            `}
          >
            <div className="flex items-start gap-2">
              {/* Drag Handle */}
              <FiMove className="text-[var(--text-muted)] flex-shrink-0 mt-0.5" />

              {/* Priority Badge */}
              <div className="w-5 h-5 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)] flex-shrink-0">
                {index + 1}
              </div>

              {/* Version Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    v{version.versionNumber}
                  </span>
                  <span className="font-medium text-sm text-[var(--text)] truncate">
                    {version.versionName}
                  </span>
                  <Tag color={getStatusColor(version.status)} className="flex-shrink-0 ml-auto">
                    {version.status}
                  </Tag>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-[var(--text-muted)] truncate">
                    {version.useCaseName}
                  </span>
                  {isGenerating ? (
                    <div className="flex items-center gap-1 text-xs text-[var(--primary)]">
                      <FiLoader className="animate-spin" size={12} />
                      <span>Generating...</span>
                    </div>
                  ) : !hasEpics ? (
                    <Button
                      variant="primary"
                      size="small"
                      icon={<FiPlus />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerate(version);
                      }}
                    >
                      Generate
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] flex-shrink-0 ml-2">
                      <span className="flex items-center gap-1">
                        <FiLayers size={11} />
                        {version.epics.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiFileText size={11} />
                        {totalStories}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * User Stories Panel Component
 *
 * Displays a list of user story cards with selection and operations toolbar.
 * State management is handled by useUserStoriesPanel hook.
 */

import { useCallback } from 'react';
import { LuTrash2, LuSplit, LuMerge, LuRefreshCw, LuPencil } from 'react-icons/lu';
import { Button } from '@/shared/ui';
import { useAuthStore } from '@/shared/auth';
import type { UserStory } from '@/features/llm-generation';
import { UserStoryCard } from '../cards/UserStoryCard';
import { StoryOperationModal } from '../modals/StoryOperationModal';
import { useUserStoriesPanel } from '../hooks/useUserStoriesPanel';

export interface UserStoriesPanelProps {
  initialStories: UserStory[];
  folderContent: string;
  onStoriesChange?: (stories: UserStory[]) => void;
}

export function UserStoriesPanel({
  initialStories,
  folderContent,
  onStoriesChange,
}: UserStoriesPanelProps) {
  const teamId = useAuthStore((state) => state.selectedTeam?.teamId ?? '');

  const {
    stories,
    selectedIds,
    selectedStories,
    selectionCount,
    modalOpen,
    operationType,
    isOperating,
    operationError,
    handleSelect,
    clearSelection,
    handleMoveUp,
    handleMoveDown,
    handleDelete,
    openOperationModal,
    handleOperation,
    closeModal,
    canDelete,
    canCombine,
    canSplit,
    canRegenerate,
    canEdit,
  } = useUserStoriesPanel({ initialStories, folderContent, teamId, onStoriesChange });

  // Memoized handlers to prevent unnecessary re-renders
  const handleOpenCombine = useCallback(() => openOperationModal('combine'), [openOperationModal]);
  const handleOpenSplit = useCallback(() => openOperationModal('split'), [openOperationModal]);
  const handleOpenRegenerate = useCallback(() => openOperationModal('regenerate'), [openOperationModal]);
  const handleOpenEdit = useCallback(() => openOperationModal('edit'), [openOperationModal]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      {stories.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)]">
          <span className="text-xs text-[var(--text-muted)] mr-2">
            {selectionCount > 0
              ? `${selectionCount} selected`
              : `${stories.length} stories`}
          </span>

          <Button
            variant="default"
            size="small"
            icon={<LuTrash2 />}
            onClick={handleDelete}
            disabled={!canDelete}
            title="Delete selected stories"
          >
            Delete
          </Button>

          <Button
            variant="default"
            size="small"
            icon={<LuMerge />}
            onClick={handleOpenCombine}
            disabled={!canCombine}
            title="Combine selected stories into one"
          >
            Combine
          </Button>

          <Button
            variant="default"
            size="small"
            icon={<LuSplit />}
            onClick={handleOpenSplit}
            disabled={!canSplit}
            title="Split selected story into multiple"
          >
            Split
          </Button>

          <Button
            variant="default"
            size="small"
            icon={<LuRefreshCw />}
            onClick={handleOpenRegenerate}
            disabled={!canRegenerate}
            title="Regenerate selected stories"
          >
            Regenerate
          </Button>

          <Button
            variant="default"
            size="small"
            icon={<LuPencil />}
            onClick={handleOpenEdit}
            disabled={!canEdit}
            title="Edit selected story"
          >
            Edit
          </Button>

          {selectionCount > 0 && (
            <Button
              variant="default"
              size="small"
              onClick={clearSelection}
              className="ml-auto"
            >
              Clear Selection
            </Button>
          )}
        </div>
      )}

      {/* Stories list */}
      <div className="flex-1 overflow-auto p-4">
        {stories.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
            No user stories yet. Click "Generate" to create stories from the
            folder content.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {stories.map((story, index) => (
              <UserStoryCard
                key={story.id}
                story={story}
                selected={selectedIds.has(story.id)}
                onSelect={handleSelect}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
                canMoveUp={index > 0}
                canMoveDown={index < stories.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Operation Modal */}
      <StoryOperationModal
        open={modalOpen}
        operationType={operationType}
        selectedStories={selectedStories}
        onConfirm={handleOperation}
        onCancel={closeModal}
        isLoading={isOperating}
        error={operationError}
      />
    </div>
  );
}

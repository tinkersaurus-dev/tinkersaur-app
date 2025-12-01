/**
 * User Stories Panel Component
 *
 * Displays a list of user story cards with selection and operations toolbar.
 * Manages local state for stories, selection, and triggers LLM operations.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { LuTrash2, LuSplit, LuMerge, LuRefreshCw, LuPencil } from 'react-icons/lu';
import { Button } from '~/core/components/ui/Button';
import type { UserStory } from '../../lib/llm/types';
import { UserStoryCard } from './UserStoryCard';
import { StoryOperationModal, type OperationType } from './StoryOperationModal';
import {
  combineUserStories,
  splitUserStory,
  regenerateUserStory,
} from '../../lib/llm/user-stories-generator-api';

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
  const [stories, setStories] = useState<UserStory[]>(initialStories);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sync stories when initialStories changes (e.g., after generation)
  useEffect(() => {
    setStories(initialStories);
    setSelectedIds(new Set()); // Clear selection when stories are regenerated
  }, [initialStories]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [operationType, setOperationType] = useState<OperationType>('combine');
  const [isOperating, setIsOperating] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  // Update stories when initialStories changes (e.g., after regeneration)
  // This is needed when parent passes new stories
  const updateStories = useCallback(
    (newStories: UserStory[]) => {
      setStories(newStories);
      onStoriesChange?.(newStories);
    },
    [onStoriesChange]
  );

  // Selection handlers
  const handleSelect = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Get selected stories
  const selectedStories = useMemo(() => {
    return stories.filter((s) => selectedIds.has(s.id));
  }, [stories, selectedIds]);

  // Reorder handlers
  const handleMoveUp = useCallback(
    (index: number) => {
      if (index === 0) return;
      const newStories = [...stories];
      [newStories[index - 1], newStories[index]] = [
        newStories[index],
        newStories[index - 1],
      ];
      updateStories(newStories);
    },
    [stories, updateStories]
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index === stories.length - 1) return;
      const newStories = [...stories];
      [newStories[index], newStories[index + 1]] = [
        newStories[index + 1],
        newStories[index],
      ];
      updateStories(newStories);
    },
    [stories, updateStories]
  );

  // Delete handler
  const handleDelete = useCallback(() => {
    const newStories = stories.filter((s) => !selectedIds.has(s.id));
    updateStories(newStories);
    clearSelection();
  }, [stories, selectedIds, updateStories, clearSelection]);

  // Open operation modal
  const openOperationModal = useCallback((type: OperationType) => {
    setOperationType(type);
    setOperationError(null);
    setModalOpen(true);
  }, []);

  // Handle LLM operations and local edit
  const handleOperation = useCallback(
    async (instructions?: string, editedStory?: UserStory) => {
      setIsOperating(true);
      setOperationError(null);

      try {
        if (operationType === 'edit' && editedStory) {
          // Local edit - no LLM call
          const newStories = stories.map((s) =>
            s.id === editedStory.id ? editedStory : s
          );
          updateStories(newStories);
          clearSelection();
          setModalOpen(false);
          setIsOperating(false);
          return;
        }

        if (operationType === 'combine') {
          // Combine selected stories
          const combinedStory = await combineUserStories(
            selectedStories,
            instructions
          );

          // Find the index of the first selected story
          const firstSelectedIndex = stories.findIndex((s) =>
            selectedIds.has(s.id)
          );

          // Replace selected stories with combined story
          const newStories = stories.filter((s) => !selectedIds.has(s.id));
          newStories.splice(firstSelectedIndex, 0, combinedStory);

          updateStories(newStories);
          clearSelection();
        } else if (operationType === 'split') {
          // Split the single selected story
          const storyToSplit = selectedStories[0];
          const splitStories = await splitUserStory(storyToSplit, instructions);

          // Find the index of the story to split
          const storyIndex = stories.findIndex((s) => s.id === storyToSplit.id);

          // Replace the story with split stories
          const newStories = [...stories];
          newStories.splice(storyIndex, 1, ...splitStories);

          updateStories(newStories);
          clearSelection();
        } else if (operationType === 'regenerate') {
          // Regenerate selected stories (one at a time for now)
          const newStories = [...stories];

          for (const story of selectedStories) {
            const regeneratedStory = await regenerateUserStory(
              story,
              folderContent,
              instructions
            );

            const storyIndex = newStories.findIndex((s) => s.id === story.id);
            if (storyIndex !== -1) {
              newStories[storyIndex] = regeneratedStory;
            }
          }

          updateStories(newStories);
          clearSelection();
        }

        setModalOpen(false);
      } catch (error) {
        setOperationError(
          error instanceof Error ? error.message : 'Operation failed'
        );
      } finally {
        setIsOperating(false);
      }
    },
    [
      operationType,
      selectedStories,
      stories,
      selectedIds,
      folderContent,
      updateStories,
      clearSelection,
    ]
  );

  // Determine which buttons are enabled
  const selectionCount = selectedIds.size;
  const canDelete = selectionCount > 0;
  const canCombine = selectionCount >= 2;
  const canSplit = selectionCount === 1;
  const canRegenerate = selectionCount > 0;
  const canEdit = selectionCount === 1;

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
            onClick={() => openOperationModal('combine')}
            disabled={!canCombine}
            title="Combine selected stories into one"
          >
            Combine
          </Button>

          <Button
            variant="default"
            size="small"
            icon={<LuSplit />}
            onClick={() => openOperationModal('split')}
            disabled={!canSplit}
            title="Split selected story into multiple"
          >
            Split
          </Button>

          <Button
            variant="default"
            size="small"
            icon={<LuRefreshCw />}
            onClick={() => openOperationModal('regenerate')}
            disabled={!canRegenerate}
            title="Regenerate selected stories"
          >
            Regenerate
          </Button>

          <Button
            variant="default"
            size="small"
            icon={<LuPencil />}
            onClick={() => openOperationModal('edit')}
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
        onCancel={() => setModalOpen(false)}
        isLoading={isOperating}
        error={operationError}
      />
    </div>
  );
}

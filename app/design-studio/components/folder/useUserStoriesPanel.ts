/**
 * User Stories Panel Hook
 *
 * Extracts state management and handlers from UserStoriesPanel.
 * Uses useReducer for the operation state machine to prevent invalid states.
 */

import { useState, useCallback, useMemo, useEffect, useReducer } from 'react';
import {
  combineUserStories,
  splitUserStory,
  regenerateUserStory,
  type UserStory,
} from '@/features/llm-generation';
import type { OperationType } from './StoryOperationModal';

// Operation state machine types
type OperationState =
  | { status: 'idle' }
  | { status: 'pending'; operationType: OperationType }
  | { status: 'operating'; operationType: OperationType }
  | { status: 'error'; operationType: OperationType; error: string };

type OperationAction =
  | { type: 'OPEN_MODAL'; operationType: OperationType }
  | { type: 'START_OPERATION' }
  | { type: 'OPERATION_SUCCESS' }
  | { type: 'OPERATION_ERROR'; error: string }
  | { type: 'CLOSE_MODAL' };

function operationReducer(
  state: OperationState,
  action: OperationAction
): OperationState {
  switch (action.type) {
    case 'OPEN_MODAL':
      return { status: 'pending', operationType: action.operationType };
    case 'START_OPERATION':
      if (state.status !== 'pending' && state.status !== 'error') return state;
      return { status: 'operating', operationType: state.operationType };
    case 'OPERATION_SUCCESS':
      return { status: 'idle' };
    case 'OPERATION_ERROR':
      if (state.status !== 'operating') return state;
      return {
        status: 'error',
        operationType: state.operationType,
        error: action.error,
      };
    case 'CLOSE_MODAL':
      return { status: 'idle' };
    default:
      return state;
  }
}

export interface UseUserStoriesPanelOptions {
  initialStories: UserStory[];
  folderContent: string;
  teamId: string;
  onStoriesChange?: (stories: UserStory[]) => void;
}

export interface UseUserStoriesPanelReturn {
  // Data state
  stories: UserStory[];
  selectedIds: Set<string>;
  selectedStories: UserStory[];
  selectionCount: number;
  // Operation state (derived from reducer)
  modalOpen: boolean;
  operationType: OperationType;
  isOperating: boolean;
  operationError: string | null;
  // Selection handlers
  handleSelect: (id: string, selected: boolean) => void;
  clearSelection: () => void;
  // Reorder handlers
  handleMoveUp: (index: number) => void;
  handleMoveDown: (index: number) => void;
  // Action handlers
  handleDelete: () => void;
  openOperationModal: (type: OperationType) => void;
  handleOperation: (instructions?: string, editedStory?: UserStory) => Promise<void>;
  closeModal: () => void;
  // Computed flags
  canDelete: boolean;
  canCombine: boolean;
  canSplit: boolean;
  canRegenerate: boolean;
  canEdit: boolean;
}

export function useUserStoriesPanel({
  initialStories,
  folderContent,
  teamId,
  onStoriesChange,
}: UseUserStoriesPanelOptions): UseUserStoriesPanelReturn {
  // Data state (simple useState)
  const [stories, setStories] = useState<UserStory[]>(initialStories);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Operation state machine (useReducer)
  const [operationState, dispatch] = useReducer(operationReducer, {
    status: 'idle',
  });

  // Sync stories when initialStories changes (e.g., after generation)
  // This is a valid "derived state reset" pattern - the effect synchronizes
  // local state with a new prop value when the parent provides fresh data
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setStories(initialStories);
    setSelectedIds(new Set());
  }, [initialStories]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Update stories helper
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

  // Computed values
  const selectedStories = useMemo(() => {
    return stories.filter((s) => selectedIds.has(s.id));
  }, [stories, selectedIds]);

  const selectionCount = selectedIds.size;

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

  // Modal handlers
  const openOperationModal = useCallback((type: OperationType) => {
    dispatch({ type: 'OPEN_MODAL', operationType: type });
  }, []);

  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' });
  }, []);

  // Handle LLM operations and local edit
  const handleOperation = useCallback(
    async (instructions?: string, editedStory?: UserStory) => {
      dispatch({ type: 'START_OPERATION' });

      // Get operationType from current state
      const currentOperationType =
        operationState.status !== 'idle' ? operationState.operationType : 'combine';

      try {
        if (currentOperationType === 'edit' && editedStory) {
          // Local edit - no LLM call
          const newStories = stories.map((s) =>
            s.id === editedStory.id ? editedStory : s
          );
          updateStories(newStories);
          clearSelection();
          dispatch({ type: 'OPERATION_SUCCESS' });
          return;
        }

        if (currentOperationType === 'combine') {
          const combinedStory = await combineUserStories(
            selectedStories,
            teamId,
            instructions
          );
          const firstSelectedIndex = stories.findIndex((s) =>
            selectedIds.has(s.id)
          );
          const newStories = stories.filter((s) => !selectedIds.has(s.id));
          newStories.splice(firstSelectedIndex, 0, combinedStory);
          updateStories(newStories);
          clearSelection();
        } else if (currentOperationType === 'split') {
          const storyToSplit = selectedStories[0];
          const splitStories = await splitUserStory(storyToSplit, teamId, instructions);
          const storyIndex = stories.findIndex((s) => s.id === storyToSplit.id);
          const newStories = [...stories];
          newStories.splice(storyIndex, 1, ...splitStories);
          updateStories(newStories);
          clearSelection();
        } else if (currentOperationType === 'regenerate') {
          const newStories = [...stories];
          for (const story of selectedStories) {
            const regeneratedStory = await regenerateUserStory(
              story,
              folderContent,
              teamId,
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

        dispatch({ type: 'OPERATION_SUCCESS' });
      } catch (error) {
        dispatch({
          type: 'OPERATION_ERROR',
          error: error instanceof Error ? error.message : 'Operation failed',
        });
      }
    },
    [
      operationState,
      selectedStories,
      stories,
      selectedIds,
      folderContent,
      teamId,
      updateStories,
      clearSelection,
    ]
  );

  // Derive values from operation state for component consumption
  const modalOpen = operationState.status !== 'idle';
  const operationType =
    operationState.status !== 'idle' ? operationState.operationType : 'combine';
  const isOperating = operationState.status === 'operating';
  const operationError =
    operationState.status === 'error' ? operationState.error : null;

  // Computed flags for button states
  const { canDelete, canCombine, canSplit, canRegenerate, canEdit } = useMemo(
    () => ({
      canDelete: selectionCount > 0,
      canCombine: selectionCount >= 2,
      canSplit: selectionCount === 1,
      canRegenerate: selectionCount > 0,
      canEdit: selectionCount === 1,
    }),
    [selectionCount]
  );

  return {
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
  };
}

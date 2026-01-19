/**
 * EpicsStoriesPanel - Right panel displaying epics and stories hierarchy
 */

import { useState, useCallback } from 'react';
import {
  FiChevronDown,
  FiChevronRight,
  FiLayers,
  FiFileText,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiLoader,
} from 'react-icons/fi';
import { Button, Tag, HStack } from '~/core/components/ui';
import type {
  PlanningVersion,
  Epic,
  Story,
  CreateStoryDto,
  CreateAcceptanceCriteriaDto,
} from '~/core/entities/product-management/types/Planning';
import {
  calculateEpicPoints,
  EpicStatusLabels,
  EpicStatusColors,
  StoryStatusLabels,
  StoryStatusColors,
  type EpicStatus,
  type StoryStatus,
} from '~/core/entities/product-management/types/Planning';
import {
  useCreateStory,
  useDeleteEpic,
  useDeleteStory,
  useCreateAcceptanceCriteria,
  useDeleteAcceptanceCriteria,
} from '~/product-management/mutations/usePlanningMutations';
import { EpicEditModal } from './EpicEditModal';
import { StoryEditModal } from './StoryEditModal';

interface EpicsStoriesPanelProps {
  versions: PlanningVersion[];
  onRefetch: () => void;
}

export function EpicsStoriesPanel({ versions, onRefetch }: EpicsStoriesPanelProps) {
  const [expandedEpicIds, setExpandedEpicIds] = useState<Set<string>>(new Set());
  const [expandedStoryIds, setExpandedStoryIds] = useState<Set<string>>(new Set());
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [addingStoryToEpicId, setAddingStoryToEpicId] = useState<string | null>(null);
  const [addingACToStoryId, setAddingACToStoryId] = useState<string | null>(null);
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [newACText, setNewACText] = useState('');

  // Mutations
  const deleteEpicMutation = useDeleteEpic();
  const createStoryMutation = useCreateStory();
  const deleteStoryMutation = useDeleteStory();
  const createACMutation = useCreateAcceptanceCriteria();
  const deleteACMutation = useDeleteAcceptanceCriteria();

  const getVersionStatusColor = (status: string): 'default' | 'blue' | 'green' | 'orange' | 'red' => {
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

  const toggleEpicExpanded = useCallback((epicId: string) => {
    setExpandedEpicIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(epicId)) {
        newSet.delete(epicId);
      } else {
        newSet.add(epicId);
      }
      return newSet;
    });
  }, []);

  const toggleStoryExpanded = useCallback((storyId: string) => {
    setExpandedStoryIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(storyId)) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return newSet;
    });
  }, []);

  const handleDeleteEpic = useCallback(
    async (epicId: string) => {
      if (!confirm('Delete this epic and all its stories?')) return;
      await deleteEpicMutation.mutateAsync(epicId);
      onRefetch();
    },
    [deleteEpicMutation, onRefetch]
  );

  const handleDeleteStory = useCallback(
    async (storyId: string) => {
      if (!confirm('Delete this story?')) return;
      await deleteStoryMutation.mutateAsync(storyId);
      onRefetch();
    },
    [deleteStoryMutation, onRefetch]
  );

  const handleAddStory = useCallback(
    async (epicId: string) => {
      if (!newStoryTitle.trim()) return;

      const data: CreateStoryDto = {
        title: newStoryTitle.trim(),
      };

      await createStoryMutation.mutateAsync({ epicId, data });
      setNewStoryTitle('');
      setAddingStoryToEpicId(null);
      onRefetch();
    },
    [newStoryTitle, createStoryMutation, onRefetch]
  );

  const handleAddAC = useCallback(
    async (storyId: string) => {
      if (!newACText.trim()) return;

      const data: CreateAcceptanceCriteriaDto = {
        text: newACText.trim(),
      };

      await createACMutation.mutateAsync({ storyId, data });
      setNewACText('');
      setAddingACToStoryId(null);
      onRefetch();
    },
    [newACText, createACMutation, onRefetch]
  );

  const handleDeleteAC = useCallback(
    async (acId: string) => {
      if (!confirm('Delete this acceptance criterion?')) return;
      await deleteACMutation.mutateAsync(acId);
      onRefetch();
    },
    [deleteACMutation, onRefetch]
  );

  return (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 space-y-3">
          {versions.map((version, versionIdx) => {
            const hasEpics = version.epics.length > 0;

            return (
              <div key={version.id} className="space-y-2">
                {/* Version Group Header */}
                <div className="flex items-center gap-2 py-2 border-b border-[var(--border-muted)]">
                  <div className="w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center text-xs font-bold text-white">
                    {versionIdx + 1}
                  </div>
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    v{version.versionNumber}
                  </span>
                  <span className="font-semibold text-[var(--text)]">{version.versionName}</span>
                  <span className="text-xs text-[var(--text-muted)]">({version.useCaseName})</span>
                  <Tag color={getVersionStatusColor(version.status)} className="ml-auto">
                    {version.status}
                  </Tag>
                </div>

                {/* Epics for this version */}
                {!hasEpics ? (
                  <div className="ml-7 py-4 text-sm text-[var(--text-muted)] italic">
                    No epics generated yet. Click "Generate" in the left panel.
                  </div>
                ) : (
                  version.epics.map((epic) => {
                    const isEpicExpanded = expandedEpicIds.has(epic.id);
                    const epicPoints = calculateEpicPoints(epic);

                    return (
                      <div
                        key={epic.id}
                        className="ml-7 border border-[var(--border-muted)] rounded bg-[var(--bg-light)]"
                      >
                        {/* Epic Header */}
                        <div
                          className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-[var(--bg)]"
                          onClick={() => toggleEpicExpanded(epic.id)}
                        >
                          {isEpicExpanded ? (
                            <FiChevronDown className="text-[var(--text-muted)]" />
                          ) : (
                            <FiChevronRight className="text-[var(--text-muted)]" />
                          )}

                          <FiLayers className="text-[var(--primary)]" />

                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-[var(--text)] truncate">
                              {epic.title}
                            </div>
                            <div className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                              {epic.description}
                            </div>
                          </div>

                          <HStack gap="sm">
                            <Tag color={EpicStatusColors[epic.status as EpicStatus] ?? 'default'}>{EpicStatusLabels[epic.status as EpicStatus] ?? epic.status}</Tag>
                            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                              <span>{epic.stories.length} stories</span>
                              <span className="font-medium">{epicPoints} pts</span>
                            </div>
                            <Button
                              variant="text"
                              size="small"
                              icon={<FiEdit2 />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingEpic(epic);
                              }}
                              title="Edit epic"
                            />
                            <Button
                              variant="text"
                              size="small"
                              icon={<FiTrash2 />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEpic(epic.id);
                              }}
                              title="Delete epic"
                              className="text-red-500 hover:text-red-600"
                            />
                          </HStack>
                        </div>

                        {/* Stories (Expanded) */}
                        {isEpicExpanded && (
                          <div className="border-t border-[var(--border-muted)]">
                            {epic.stories.map((story, storyIndex) => {
                              const isStoryExpanded = expandedStoryIds.has(story.id);

                              return (
                                <div
                                  key={story.id}
                                  className={`
                                    ${storyIndex < epic.stories.length - 1 ? 'border-b border-[var(--border-muted)]' : ''}
                                  `}
                                >
                                  {/* Story Header Row */}
                                  <div
                                    className="px-4 py-2 flex items-center gap-3 text-sm hover:bg-[var(--bg)] cursor-pointer"
                                    onClick={() => toggleStoryExpanded(story.id)}
                                  >
                                    {isStoryExpanded ? (
                                      <FiChevronDown
                                        className="text-[var(--text-muted)] flex-shrink-0"
                                        size={14}
                                      />
                                    ) : (
                                      <FiChevronRight
                                        className="text-[var(--text-muted)] flex-shrink-0"
                                        size={14}
                                      />
                                    )}
                                    <div className="w-5 h-5 rounded bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-mono text-[var(--text-muted)]">
                                      {storyIndex + 1}
                                    </div>
                                    <FiFileText className="text-[var(--text-muted)] flex-shrink-0" />
                                    <span className="flex-1 text-[var(--text)]">{story.title}</span>
                                    {!isStoryExpanded && story.acceptanceCriteria.length > 0 && (
                                      <span className="text-xs text-[var(--text-muted)]">
                                        {story.acceptanceCriteria.length} criteria
                                      </span>
                                    )}
                                    <Tag color={StoryStatusColors[story.status as StoryStatus] ?? 'default'}>
                                      {StoryStatusLabels[story.status as StoryStatus] ?? story.status}
                                    </Tag>
                                    {story.storyPoints !== null && (
                                      <Tag color="blue">{story.storyPoints} pts</Tag>
                                    )}
                                    <Button
                                      variant="text"
                                      size="small"
                                      icon={<FiEdit2 />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingStory(story);
                                      }}
                                      title="Edit story"
                                    />
                                    <Button
                                      variant="text"
                                      size="small"
                                      icon={<FiTrash2 />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteStory(story.id);
                                      }}
                                      title="Delete story"
                                      className="text-red-500 hover:text-red-600"
                                    />
                                  </div>

                                  {/* Acceptance Criteria (Expanded) */}
                                  {isStoryExpanded && (
                                    <div className="pl-16 pr-4 pb-3 bg-[var(--bg)]">
                                      {story.description && (
                                        <p className="text-sm text-[var(--text-muted)] mb-2">
                                          {story.description}
                                        </p>
                                      )}
                                      <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                                        Acceptance Criteria
                                      </div>
                                      <ul className="space-y-1">
                                        {story.acceptanceCriteria.map((ac) => (
                                          <li
                                            key={ac.id}
                                            className="flex items-start gap-2 text-sm text-[var(--text)] group"
                                          >
                                            <FiCheck
                                              className="text-green-500 flex-shrink-0 mt-0.5"
                                              size={14}
                                            />
                                            <span className="flex-1">{ac.text}</span>
                                            <button
                                              onClick={() => handleDeleteAC(ac.id)}
                                              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-opacity"
                                              title="Delete"
                                            >
                                              <FiTrash2 size={12} />
                                            </button>
                                          </li>
                                        ))}
                                      </ul>

                                      {/* Add AC inline */}
                                      {addingACToStoryId === story.id ? (
                                        <div className="mt-2 flex items-center gap-2">
                                          <input
                                            type="text"
                                            value={newACText}
                                            onChange={(e) => setNewACText(e.target.value)}
                                            placeholder="Enter acceptance criterion..."
                                            className="flex-1 px-2 py-1 text-sm border border-[var(--border-muted)] rounded bg-[var(--bg)] text-[var(--text)]"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleAddAC(story.id);
                                              if (e.key === 'Escape') {
                                                setAddingACToStoryId(null);
                                                setNewACText('');
                                              }
                                            }}
                                          />
                                          <Button
                                            variant="primary"
                                            size="small"
                                            onClick={() => handleAddAC(story.id)}
                                            disabled={!newACText.trim() || createACMutation.isPending}
                                          >
                                            {createACMutation.isPending ? (
                                              <FiLoader className="animate-spin" />
                                            ) : (
                                              'Add'
                                            )}
                                          </Button>
                                          <Button
                                            variant="text"
                                            size="small"
                                            onClick={() => {
                                              setAddingACToStoryId(null);
                                              setNewACText('');
                                            }}
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      ) : (
                                        <Button
                                          variant="text"
                                          size="small"
                                          icon={<FiPlus />}
                                          onClick={() => setAddingACToStoryId(story.id)}
                                          className="mt-2 text-[var(--text-muted)]"
                                        >
                                          Add Criterion
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Add story button */}
                            <div className="px-4 py-2 border-t border-dashed border-[var(--border-muted)]">
                              {addingStoryToEpicId === epic.id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={newStoryTitle}
                                    onChange={(e) => setNewStoryTitle(e.target.value)}
                                    placeholder="Enter story title..."
                                    className="flex-1 px-2 py-1 text-sm border border-[var(--border-muted)] rounded bg-[var(--bg)] text-[var(--text)]"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleAddStory(epic.id);
                                      if (e.key === 'Escape') {
                                        setAddingStoryToEpicId(null);
                                        setNewStoryTitle('');
                                      }
                                    }}
                                  />
                                  <Button
                                    variant="primary"
                                    size="small"
                                    onClick={() => handleAddStory(epic.id)}
                                    disabled={!newStoryTitle.trim() || createStoryMutation.isPending}
                                  >
                                    {createStoryMutation.isPending ? (
                                      <FiLoader className="animate-spin" />
                                    ) : (
                                      'Add'
                                    )}
                                  </Button>
                                  <Button
                                    variant="text"
                                    size="small"
                                    onClick={() => {
                                      setAddingStoryToEpicId(null);
                                      setNewStoryTitle('');
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="text"
                                  size="small"
                                  icon={<FiPlus />}
                                  onClick={() => setAddingStoryToEpicId(epic.id)}
                                  className="text-[var(--text-muted)]"
                                >
                                  Add Story
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Modals */}
      {editingEpic && (
        <EpicEditModal
          epic={editingEpic}
          open={!!editingEpic}
          onClose={() => setEditingEpic(null)}
          onSuccess={() => {
            setEditingEpic(null);
            onRefetch();
          }}
        />
      )}

      {editingStory && (
        <StoryEditModal
          story={editingStory}
          open={!!editingStory}
          onClose={() => setEditingStory(null)}
          onSuccess={() => {
            setEditingStory(null);
            onRefetch();
          }}
        />
      )}
    </>
  );
}

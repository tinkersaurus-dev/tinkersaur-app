import { create } from 'zustand';
import type {
  PlanningVersion,
  Epic,
  Story,
  AcceptanceCriteria,
  CreateEpicDto,
  UpdateEpicDto,
  CreateStoryDto,
  UpdateStoryDto,
  CreateAcceptanceCriteriaDto,
  UpdateAcceptanceCriteriaDto,
  VersionPriorityItem,
  GenerateEpicsStoriesRequest,
  GenerateEpicsStoriesResponse,
} from '@/entities/planning';
import {
  planningApi,
  epicApi,
  storyApi,
  acceptanceCriteriaApi,
  planningAiApi,
} from '@/entities/planning';

interface PlanningStore {
  // State
  versions: Record<string, PlanningVersion[]>; // Indexed by solutionId
  loading: boolean;
  error: Error | null;
  generatingVersionIds: Set<string>;
  expandedEpicIds: Set<string>;
  expandedStoryIds: Set<string>;

  // Version actions
  fetchVersions: (solutionId: string) => Promise<PlanningVersion[]>;
  updatePriorities: (solutionId: string, priorities: VersionPriorityItem[]) => Promise<void>;

  // Epic actions
  createEpic: (versionId: string, data: CreateEpicDto) => Promise<Epic>;
  updateEpic: (epicId: string, data: UpdateEpicDto) => Promise<Epic>;
  deleteEpic: (epicId: string) => Promise<void>;
  reorderEpics: (versionId: string, epicIds: string[]) => Promise<void>;

  // Story actions
  createStory: (epicId: string, data: CreateStoryDto) => Promise<Story>;
  updateStory: (storyId: string, data: UpdateStoryDto) => Promise<Story>;
  deleteStory: (storyId: string) => Promise<void>;
  reorderStories: (epicId: string, storyIds: string[]) => Promise<void>;

  // Acceptance Criteria actions
  createAcceptanceCriteria: (storyId: string, data: CreateAcceptanceCriteriaDto) => Promise<AcceptanceCriteria>;
  updateAcceptanceCriteria: (id: string, data: UpdateAcceptanceCriteriaDto) => Promise<AcceptanceCriteria>;
  deleteAcceptanceCriteria: (id: string) => Promise<void>;

  // AI Generation
  generateEpicsStories: (teamId: string, request: GenerateEpicsStoriesRequest) => Promise<GenerateEpicsStoriesResponse>;

  // UI State actions
  toggleEpicExpanded: (epicId: string) => void;
  toggleStoryExpanded: (storyId: string) => void;
  setAllExpanded: (expanded: boolean) => void;

  // Utility
  clearVersions: (solutionId: string) => void;
  clearError: () => void;
}

export const usePlanningStore = create<PlanningStore>((set, get) => ({
  // Initial state
  versions: {},
  loading: false,
  error: null,
  generatingVersionIds: new Set(),
  expandedEpicIds: new Set(),
  expandedStoryIds: new Set(),

  // Version actions
  fetchVersions: async (solutionId: string) => {
    set({ loading: true, error: null });
    try {
      const versions = await planningApi.getVersionsForSolution(solutionId);
      set((state) => ({
        versions: { ...state.versions, [solutionId]: versions },
        loading: false,
      }));
      return versions;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch planning versions');
      set({ error: err, loading: false });
      throw error;
    }
  },

  updatePriorities: async (solutionId: string, priorities: VersionPriorityItem[]) => {
    set({ loading: true, error: null });
    try {
      await planningApi.updatePriorities(solutionId, { priorities });
      // Refresh versions to get updated priorities
      const versions = await planningApi.getVersionsForSolution(solutionId);
      set((state) => ({
        versions: { ...state.versions, [solutionId]: versions },
        loading: false,
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update priorities');
      set({ error: err, loading: false });
      throw error;
    }
  },

  // Epic actions
  createEpic: async (versionId: string, data: CreateEpicDto) => {
    set({ loading: true, error: null });
    try {
      const epic = await epicApi.create(versionId, data);
      // Update local state
      set((state) => {
        const newVersions = { ...state.versions };
        for (const solutionId in newVersions) {
          newVersions[solutionId] = newVersions[solutionId].map((v) => {
            if (v.id === versionId) {
              return { ...v, epics: [...v.epics, { ...epic, stories: [] }] };
            }
            return v;
          });
        }
        return { versions: newVersions, loading: false };
      });
      return epic;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create epic');
      set({ error: err, loading: false });
      throw error;
    }
  },

  updateEpic: async (epicId: string, data: UpdateEpicDto) => {
    set({ loading: true, error: null });
    try {
      const updated = await epicApi.update(epicId, data);
      set((state) => {
        const newVersions = { ...state.versions };
        for (const solutionId in newVersions) {
          newVersions[solutionId] = newVersions[solutionId].map((v) => ({
            ...v,
            epics: v.epics.map((e: Epic) => (e.id === epicId ? { ...e, ...updated } : e)),
          }));
        }
        return { versions: newVersions, loading: false };
      });
      return updated;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update epic');
      set({ error: err, loading: false });
      throw error;
    }
  },

  deleteEpic: async (epicId: string) => {
    set({ loading: true, error: null });
    try {
      await epicApi.delete(epicId);
      set((state) => {
        const newVersions = { ...state.versions };
        for (const solutionId in newVersions) {
          newVersions[solutionId] = newVersions[solutionId].map((v) => ({
            ...v,
            epics: v.epics.filter((e: Epic) => e.id !== epicId),
          }));
        }
        const newExpandedEpicIds = new Set(state.expandedEpicIds);
        newExpandedEpicIds.delete(epicId);
        return { versions: newVersions, expandedEpicIds: newExpandedEpicIds, loading: false };
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete epic');
      set({ error: err, loading: false });
      throw error;
    }
  },

  reorderEpics: async (versionId: string, epicIds: string[]) => {
    set({ loading: true, error: null });
    try {
      await epicApi.reorder(versionId, epicIds);
      // Update local state with new order
      set((state) => {
        const newVersions = { ...state.versions };
        for (const solutionId in newVersions) {
          newVersions[solutionId] = newVersions[solutionId].map((v) => {
            if (v.id === versionId) {
              const epicMap = new Map(v.epics.map((e: Epic) => [e.id, e]));
              const reorderedEpics = epicIds
                .map((id) => epicMap.get(id))
                .filter((e): e is Epic => e !== undefined)
                .map((e, idx) => ({ ...e, order: idx }));
              return { ...v, epics: reorderedEpics };
            }
            return v;
          });
        }
        return { versions: newVersions, loading: false };
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to reorder epics');
      set({ error: err, loading: false });
      throw error;
    }
  },

  // Story actions
  createStory: async (epicId: string, data: CreateStoryDto) => {
    set({ loading: true, error: null });
    try {
      const story = await storyApi.create(epicId, data);
      set((state) => {
        const newVersions = { ...state.versions };
        for (const solutionId in newVersions) {
          newVersions[solutionId] = newVersions[solutionId].map((v) => ({
            ...v,
            epics: v.epics.map((e: Epic) => {
              if (e.id === epicId) {
                return { ...e, stories: [...e.stories, { ...story, acceptanceCriteria: [] }] };
              }
              return e;
            }),
          }));
        }
        return { versions: newVersions, loading: false };
      });
      return story;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create story');
      set({ error: err, loading: false });
      throw error;
    }
  },

  updateStory: async (storyId: string, data: UpdateStoryDto) => {
    set({ loading: true, error: null });
    try {
      const updated = await storyApi.update(storyId, data);
      set((state) => {
        const newVersions = { ...state.versions };
        for (const solutionId in newVersions) {
          newVersions[solutionId] = newVersions[solutionId].map((v) => ({
            ...v,
            epics: v.epics.map((e: Epic) => ({
              ...e,
              stories: e.stories.map((s: Story) => (s.id === storyId ? { ...s, ...updated } : s)),
            })),
          }));
        }
        return { versions: newVersions, loading: false };
      });
      return updated;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update story');
      set({ error: err, loading: false });
      throw error;
    }
  },

  deleteStory: async (storyId: string) => {
    set({ loading: true, error: null });
    try {
      await storyApi.delete(storyId);
      set((state) => {
        const newVersions = { ...state.versions };
        for (const solutionId in newVersions) {
          newVersions[solutionId] = newVersions[solutionId].map((v) => ({
            ...v,
            epics: v.epics.map((e: Epic) => ({
              ...e,
              stories: e.stories.filter((s: Story) => s.id !== storyId),
            })),
          }));
        }
        const newExpandedStoryIds = new Set(state.expandedStoryIds);
        newExpandedStoryIds.delete(storyId);
        return { versions: newVersions, expandedStoryIds: newExpandedStoryIds, loading: false };
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete story');
      set({ error: err, loading: false });
      throw error;
    }
  },

  reorderStories: async (epicId: string, storyIds: string[]) => {
    set({ loading: true, error: null });
    try {
      await storyApi.reorder(epicId, storyIds);
      set((state) => {
        const newVersions = { ...state.versions };
        for (const solutionId in newVersions) {
          newVersions[solutionId] = newVersions[solutionId].map((v) => ({
            ...v,
            epics: v.epics.map((e: Epic) => {
              if (e.id === epicId) {
                const storyMap = new Map(e.stories.map((s: Story) => [s.id, s]));
                const reorderedStories = storyIds
                  .map((id) => storyMap.get(id))
                  .filter((s): s is Story => s !== undefined)
                  .map((s, idx) => ({ ...s, order: idx }));
                return { ...e, stories: reorderedStories };
              }
              return e;
            }),
          }));
        }
        return { versions: newVersions, loading: false };
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to reorder stories');
      set({ error: err, loading: false });
      throw error;
    }
  },

  // Acceptance Criteria actions
  createAcceptanceCriteria: async (storyId: string, data: CreateAcceptanceCriteriaDto) => {
    set({ loading: true, error: null });
    try {
      const ac = await acceptanceCriteriaApi.create(storyId, data);
      set((state) => {
        const newVersions = { ...state.versions };
        for (const solutionId in newVersions) {
          newVersions[solutionId] = newVersions[solutionId].map((v) => ({
            ...v,
            epics: v.epics.map((e: Epic) => ({
              ...e,
              stories: e.stories.map((s: Story) => {
                if (s.id === storyId) {
                  return { ...s, acceptanceCriteria: [...s.acceptanceCriteria, ac] };
                }
                return s;
              }),
            })),
          }));
        }
        return { versions: newVersions, loading: false };
      });
      return ac;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create acceptance criteria');
      set({ error: err, loading: false });
      throw error;
    }
  },

  updateAcceptanceCriteria: async (id: string, data: UpdateAcceptanceCriteriaDto) => {
    set({ loading: true, error: null });
    try {
      const updated = await acceptanceCriteriaApi.update(id, data);
      set((state) => {
        const newVersions = { ...state.versions };
        for (const solutionId in newVersions) {
          newVersions[solutionId] = newVersions[solutionId].map((v) => ({
            ...v,
            epics: v.epics.map((e: Epic) => ({
              ...e,
              stories: e.stories.map((s: Story) => ({
                ...s,
                acceptanceCriteria: s.acceptanceCriteria.map((ac: AcceptanceCriteria) =>
                  ac.id === id ? { ...ac, ...updated } : ac
                ),
              })),
            })),
          }));
        }
        return { versions: newVersions, loading: false };
      });
      return updated;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update acceptance criteria');
      set({ error: err, loading: false });
      throw error;
    }
  },

  deleteAcceptanceCriteria: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await acceptanceCriteriaApi.delete(id);
      set((state) => {
        const newVersions = { ...state.versions };
        for (const solutionId in newVersions) {
          newVersions[solutionId] = newVersions[solutionId].map((v) => ({
            ...v,
            epics: v.epics.map((e: Epic) => ({
              ...e,
              stories: e.stories.map((s: Story) => ({
                ...s,
                acceptanceCriteria: s.acceptanceCriteria.filter((ac: AcceptanceCriteria) => ac.id !== id),
              })),
            })),
          }));
        }
        return { versions: newVersions, loading: false };
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete acceptance criteria');
      set({ error: err, loading: false });
      throw error;
    }
  },

  // AI Generation
  generateEpicsStories: async (teamId: string, request: GenerateEpicsStoriesRequest) => {
    const { versionId } = request;
    set((state) => ({
      generatingVersionIds: new Set(state.generatingVersionIds).add(versionId),
      error: null,
    }));
    try {
      const response = await planningAiApi.generateEpicsStories(teamId, request);
      set((state) => {
        const newGenerating = new Set(state.generatingVersionIds);
        newGenerating.delete(versionId);
        return { generatingVersionIds: newGenerating };
      });
      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to generate epics and stories');
      set((state) => {
        const newGenerating = new Set(state.generatingVersionIds);
        newGenerating.delete(versionId);
        return { error: err, generatingVersionIds: newGenerating };
      });
      throw error;
    }
  },

  // UI State actions
  toggleEpicExpanded: (epicId: string) => {
    set((state) => {
      const newSet = new Set(state.expandedEpicIds);
      if (newSet.has(epicId)) {
        newSet.delete(epicId);
      } else {
        newSet.add(epicId);
      }
      return { expandedEpicIds: newSet };
    });
  },

  toggleStoryExpanded: (storyId: string) => {
    set((state) => {
      const newSet = new Set(state.expandedStoryIds);
      if (newSet.has(storyId)) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return { expandedStoryIds: newSet };
    });
  },

  setAllExpanded: (expanded: boolean) => {
    if (expanded) {
      // Expand all epics and stories
      const allEpicIds = new Set<string>();
      const allStoryIds = new Set<string>();
      const { versions } = get();
      for (const solutionId in versions) {
        for (const version of versions[solutionId]) {
          for (const epic of version.epics) {
            allEpicIds.add(epic.id);
            for (const story of epic.stories) {
              allStoryIds.add(story.id);
            }
          }
        }
      }
      set({ expandedEpicIds: allEpicIds, expandedStoryIds: allStoryIds });
    } else {
      set({ expandedEpicIds: new Set(), expandedStoryIds: new Set() });
    }
  },

  // Utility
  clearVersions: (solutionId: string) => {
    set((state) => {
      const newVersions = { ...state.versions };
      delete newVersions[solutionId];
      return { versions: newVersions };
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));

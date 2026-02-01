import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query';
import {
  planningApi,
  epicApi,
  storyApi,
  acceptanceCriteriaApi,
  planningAiApi,
} from '@/entities/planning';
import type {
  CreateEpicDto,
  UpdateEpicDto,
  CreateStoryDto,
  UpdateStoryDto,
  CreateAcceptanceCriteriaDto,
  UpdateAcceptanceCriteriaDto,
  VersionPriorityItem,
  GenerateEpicsStoriesRequest,
} from '@/entities/planning';

// ============ Planning Priority Mutations ============

/**
 * Mutation hook for updating planning priorities
 */
export function useUpdatePlanningPriorities() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ solutionId, priorities }: { solutionId: string; priorities: VersionPriorityItem[] }) =>
      planningApi.updatePriorities(solutionId, { priorities }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.planning.versions(variables.solutionId) });
      toast.success('Priorities updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update priorities');
    },
  });
}

// ============ Epic Mutations ============

/**
 * Mutation hook for creating an epic
 */
export function useCreateEpic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ versionId, data }: { versionId: string; data: CreateEpicDto }) =>
      epicApi.create(versionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.epics.byVersion(variables.versionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.planning.all });
      toast.success('Epic created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create epic');
    },
  });
}

/**
 * Mutation hook for updating an epic
 */
export function useUpdateEpic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ epicId, data }: { epicId: string; data: UpdateEpicDto }) =>
      epicApi.update(epicId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.epics.detail(variables.epicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.epics.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.planning.all });
      toast.success('Epic updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update epic');
    },
  });
}

/**
 * Mutation hook for deleting an epic
 */
export function useDeleteEpic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (epicId: string) => epicApi.delete(epicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.epics.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.planning.all });
      toast.success('Epic deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete epic');
    },
  });
}

/**
 * Mutation hook for reordering epics
 */
export function useReorderEpics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ versionId, epicIds }: { versionId: string; epicIds: string[] }) =>
      epicApi.reorder(versionId, epicIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.epics.byVersion(variables.versionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.planning.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reorder epics');
    },
  });
}

// ============ Story Mutations ============

/**
 * Mutation hook for creating a story
 */
export function useCreateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ epicId, data }: { epicId: string; data: CreateStoryDto }) =>
      storyApi.create(epicId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.byEpic(variables.epicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.epics.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.planning.all });
      toast.success('Story created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create story');
    },
  });
}

/**
 * Mutation hook for updating a story
 */
export function useUpdateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storyId, data }: { storyId: string; data: UpdateStoryDto }) =>
      storyApi.update(storyId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.detail(variables.storyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.planning.all });
      toast.success('Story updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update story');
    },
  });
}

/**
 * Mutation hook for deleting a story
 */
export function useDeleteStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storyId: string) => storyApi.delete(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.planning.all });
      toast.success('Story deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete story');
    },
  });
}

/**
 * Mutation hook for reordering stories
 */
export function useReorderStories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ epicId, storyIds }: { epicId: string; storyIds: string[] }) =>
      storyApi.reorder(epicId, storyIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.byEpic(variables.epicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.planning.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reorder stories');
    },
  });
}

// ============ Acceptance Criteria Mutations ============

/**
 * Mutation hook for creating acceptance criteria
 */
export function useCreateAcceptanceCriteria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storyId, data }: { storyId: string; data: CreateAcceptanceCriteriaDto }) =>
      acceptanceCriteriaApi.create(storyId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.acceptanceCriteria.byStory(variables.storyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.planning.all });
      toast.success('Acceptance criteria added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add acceptance criteria');
    },
  });
}

/**
 * Mutation hook for updating acceptance criteria
 */
export function useUpdateAcceptanceCriteria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAcceptanceCriteriaDto }) =>
      acceptanceCriteriaApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.acceptanceCriteria.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.planning.all });
      toast.success('Acceptance criteria updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update acceptance criteria');
    },
  });
}

/**
 * Mutation hook for deleting acceptance criteria
 */
export function useDeleteAcceptanceCriteria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => acceptanceCriteriaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.acceptanceCriteria.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.planning.all });
      toast.success('Acceptance criteria deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete acceptance criteria');
    },
  });
}

// ============ AI Generation Mutations ============

/**
 * Mutation hook for generating epics and stories via AI
 */
export function useGenerateEpicsStories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, request }: { teamId: string; request: GenerateEpicsStoriesRequest }) =>
      planningAiApi.generateEpicsStories(teamId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.epics.byVersion(variables.request.versionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.planning.all });
      toast.success('Epics and stories generated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate epics and stories');
    },
  });
}

// ============ Export ============

/**
 * Mutation hook for exporting planning data
 * Returns the export content as a blob for download
 */
export function useExportPlanning() {
  return useMutation({
    mutationFn: async ({
      solutionId,
      format,
      includeAcceptanceCriteria = true,
      includeStoryPoints = true,
    }: {
      solutionId: string;
      format: 'json' | 'csv' | 'jira';
      includeAcceptanceCriteria?: boolean;
      includeStoryPoints?: boolean;
    }) => {
      const content = await planningApi.export(solutionId, {
        format,
        includeAcceptanceCriteria,
        includeStoryPoints,
      });
      return { content, format };
    },
    onSuccess: ({ content, format }) => {
      // Create blob and download
      const mimeType =
        format === 'json'
          ? 'application/json'
          : format === 'csv'
            ? 'text/csv'
            : 'text/csv'; // Jira uses CSV format
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `planning-export.${format === 'jira' ? 'csv' : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Planning data exported successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to export planning data');
    },
  });
}

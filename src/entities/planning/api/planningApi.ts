import { httpClient } from '@/shared/api';
import type {
  PlanningVersion,
  UpdatePlanningPrioritiesDto,
  Epic,
  CreateEpicDto,
  UpdateEpicDto,
  Story,
  CreateStoryDto,
  UpdateStoryDto,
  AcceptanceCriteria,
  CreateAcceptanceCriteriaDto,
  UpdateAcceptanceCriteriaDto,
  GenerateEpicsStoriesRequest,
  GenerateEpicsStoriesResponse,
  PlanningExportOptions,
} from '../model/types';

// ============================================================================
// Planning API
// ============================================================================

export const planningApi = {
  /**
   * Get all versions for a solution with their epics and stories
   */
  async getVersionsForSolution(solutionId: string): Promise<PlanningVersion[]> {
    return httpClient.get<PlanningVersion[]>(`/api/solutions/${solutionId}/planning/versions`);
  },

  /**
   * Update planning priorities for multiple versions
   */
  async updatePriorities(solutionId: string, data: UpdatePlanningPrioritiesDto): Promise<void> {
    await httpClient.put(`/api/solutions/${solutionId}/planning/versions/priorities`, data);
  },

  /**
   * Export planning data in specified format
   */
  async export(solutionId: string, options: PlanningExportOptions): Promise<string> {
    const params = new URLSearchParams({
      solutionId,
      format: options.format,
      includeAcceptanceCriteria: String(options.includeAcceptanceCriteria),
      includeStoryPoints: String(options.includeStoryPoints),
    });
    return httpClient.get<string>(`/api/planning/export?${params.toString()}`);
  },
};

// ============================================================================
// Epic API
// ============================================================================

export const epicApi = {
  /**
   * List epics for a version
   */
  async list(versionId: string): Promise<Epic[]> {
    return httpClient.get<Epic[]>(`/api/versions/${versionId}/epics`);
  },

  /**
   * Get epic by ID
   */
  async get(epicId: string): Promise<Epic> {
    return httpClient.get<Epic>(`/api/epics/${epicId}`);
  },

  /**
   * Create an epic for a version
   */
  async create(versionId: string, data: CreateEpicDto): Promise<Epic> {
    return httpClient.post<Epic>(`/api/versions/${versionId}/epics`, data);
  },

  /**
   * Update an epic
   */
  async update(epicId: string, data: UpdateEpicDto): Promise<Epic> {
    return httpClient.put<Epic>(`/api/epics/${epicId}`, data);
  },

  /**
   * Delete an epic
   */
  async delete(epicId: string): Promise<void> {
    await httpClient.delete(`/api/epics/${epicId}`);
  },

  /**
   * Reorder epics within a version
   */
  async reorder(versionId: string, epicIds: string[]): Promise<void> {
    await httpClient.put(`/api/versions/${versionId}/epics/reorder`, { epicIds });
  },
};

// ============================================================================
// Story API
// ============================================================================

export const storyApi = {
  /**
   * List stories for an epic
   */
  async list(epicId: string): Promise<Story[]> {
    return httpClient.get<Story[]>(`/api/epics/${epicId}/stories`);
  },

  /**
   * Get story by ID
   */
  async get(storyId: string): Promise<Story> {
    return httpClient.get<Story>(`/api/stories/${storyId}`);
  },

  /**
   * Create a story for an epic
   */
  async create(epicId: string, data: CreateStoryDto): Promise<Story> {
    return httpClient.post<Story>(`/api/epics/${epicId}/stories`, data);
  },

  /**
   * Update a story
   */
  async update(storyId: string, data: UpdateStoryDto): Promise<Story> {
    return httpClient.put<Story>(`/api/stories/${storyId}`, data);
  },

  /**
   * Delete a story
   */
  async delete(storyId: string): Promise<void> {
    await httpClient.delete(`/api/stories/${storyId}`);
  },

  /**
   * Reorder stories within an epic
   */
  async reorder(epicId: string, storyIds: string[]): Promise<void> {
    await httpClient.put(`/api/epics/${epicId}/stories/reorder`, { storyIds });
  },
};

// ============================================================================
// Acceptance Criteria API
// ============================================================================

export const acceptanceCriteriaApi = {
  /**
   * List acceptance criteria for a story
   */
  async list(storyId: string): Promise<AcceptanceCriteria[]> {
    return httpClient.get<AcceptanceCriteria[]>(`/api/stories/${storyId}/acceptance-criteria`);
  },

  /**
   * Get acceptance criteria by ID
   */
  async get(id: string): Promise<AcceptanceCriteria> {
    return httpClient.get<AcceptanceCriteria>(`/api/acceptance-criteria/${id}`);
  },

  /**
   * Create acceptance criteria for a story
   */
  async create(storyId: string, data: CreateAcceptanceCriteriaDto): Promise<AcceptanceCriteria> {
    return httpClient.post<AcceptanceCriteria>(`/api/stories/${storyId}/acceptance-criteria`, data);
  },

  /**
   * Update acceptance criteria
   */
  async update(id: string, data: UpdateAcceptanceCriteriaDto): Promise<AcceptanceCriteria> {
    return httpClient.put<AcceptanceCriteria>(`/api/acceptance-criteria/${id}`, data);
  },

  /**
   * Delete acceptance criteria
   */
  async delete(id: string): Promise<void> {
    await httpClient.delete(`/api/acceptance-criteria/${id}`);
  },

  /**
   * Reorder acceptance criteria within a story
   */
  async reorder(storyId: string, acceptanceCriteriaIds: string[]): Promise<void> {
    await httpClient.put(`/api/stories/${storyId}/acceptance-criteria/reorder`, {
      acceptanceCriteriaIds,
    });
  },
};

// ============================================================================
// AI Generation API
// ============================================================================

export const planningAiApi = {
  /**
   * Generate epics and stories for a use case version
   */
  async generateEpicsStories(
    teamId: string,
    request: GenerateEpicsStoriesRequest
  ): Promise<GenerateEpicsStoriesResponse> {
    return httpClient.post<GenerateEpicsStoriesResponse>(
      `/api/ai/generate-epics-stories?teamId=${teamId}`,
      request
    );
  },
};

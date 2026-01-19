import { z } from 'zod';

/**
 * Planning domain models
 * Represents epics, stories, and acceptance criteria for agile planning
 */

// Status enums
export const EpicStatus = {
  ToDo: 'ToDo',
  Doing: 'Doing',
  Done: 'Done',
  Archived: 'Archived',
} as const;

export type EpicStatus = (typeof EpicStatus)[keyof typeof EpicStatus];

export const EpicStatusLabels: Record<EpicStatus, string> = {
  [EpicStatus.ToDo]: 'To Do',
  [EpicStatus.Doing]: 'Doing',
  [EpicStatus.Done]: 'Done',
  [EpicStatus.Archived]: 'Archived',
};

export type StatusColor = 'default' | 'blue' | 'green' | 'orange';

export const EpicStatusColors: Record<EpicStatus, StatusColor> = {
  [EpicStatus.ToDo]: 'default',
  [EpicStatus.Doing]: 'blue',
  [EpicStatus.Done]: 'green',
  [EpicStatus.Archived]: 'orange',
};

export const StoryStatus = {
  ToDo: 'ToDo',
  Doing: 'Doing',
  Done: 'Done',
  Archived: 'Archived',
} as const;

export type StoryStatus = (typeof StoryStatus)[keyof typeof StoryStatus];

export const StoryStatusLabels: Record<StoryStatus, string> = {
  [StoryStatus.ToDo]: 'To Do',
  [StoryStatus.Doing]: 'Doing',
  [StoryStatus.Done]: 'Done',
  [StoryStatus.Archived]: 'Archived',
};

export const StoryStatusColors: Record<StoryStatus, StatusColor> = {
  [StoryStatus.ToDo]: 'default',
  [StoryStatus.Doing]: 'blue',
  [StoryStatus.Done]: 'green',
  [StoryStatus.Archived]: 'orange',
};

// Acceptance Criteria
export const AcceptanceCriteriaSchema = z.object({
  id: z.string().uuid(),
  storyId: z.string().uuid(),
  text: z.string(),
  order: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type AcceptanceCriteria = z.infer<typeof AcceptanceCriteriaSchema>;

export const CreateAcceptanceCriteriaSchema = z.object({
  text: z.string().min(1, 'Text is required'),
});

export type CreateAcceptanceCriteriaDto = z.infer<typeof CreateAcceptanceCriteriaSchema>;

export const UpdateAcceptanceCriteriaSchema = z.object({
  text: z.string().min(1).optional(),
});

export type UpdateAcceptanceCriteriaDto = z.infer<typeof UpdateAcceptanceCriteriaSchema>;

// Story
export const StorySchema = z.object({
  id: z.string().uuid(),
  epicId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  storyPoints: z.number().nullable(),
  order: z.number(),
  status: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  acceptanceCriteria: z.array(AcceptanceCriteriaSchema),
});

export type Story = z.infer<typeof StorySchema>;

export const CreateStorySchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(5000).optional(),
  storyPoints: z.number().min(1).max(100).optional(),
});

export type CreateStoryDto = z.infer<typeof CreateStorySchema>;

export const UpdateStorySchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  storyPoints: z.number().min(1).max(100).nullable().optional(),
  status: z.string().optional(),
});

export type UpdateStoryDto = z.infer<typeof UpdateStorySchema>;

// Epic
export const EpicSchema = z.object({
  id: z.string().uuid(),
  useCaseVersionId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  order: z.number(),
  status: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  stories: z.array(StorySchema),
});

export type Epic = z.infer<typeof EpicSchema>;

export const CreateEpicSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(5000).optional(),
});

export type CreateEpicDto = z.infer<typeof CreateEpicSchema>;

export const UpdateEpicSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  status: z.string().optional(),
});

export type UpdateEpicDto = z.infer<typeof UpdateEpicSchema>;

// Planning Version (version with use case context and epics)
export const PlanningVersionSchema = z.object({
  id: z.string().uuid(),
  useCaseId: z.string().uuid(),
  useCaseName: z.string(),
  versionName: z.string(),
  versionNumber: z.number(),
  status: z.string(),
  planningPriority: z.number().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  epics: z.array(EpicSchema),
});

export type PlanningVersion = z.infer<typeof PlanningVersionSchema>;

// Planning priority update
export const VersionPriorityItemSchema = z.object({
  versionId: z.string().uuid(),
  priority: z.number(),
});

export type VersionPriorityItem = z.infer<typeof VersionPriorityItemSchema>;

export const UpdatePlanningPrioritiesSchema = z.object({
  priorities: z.array(VersionPriorityItemSchema),
});

export type UpdatePlanningPrioritiesDto = z.infer<typeof UpdatePlanningPrioritiesSchema>;

// AI Generation types
export const GeneratedStorySchema = z.object({
  title: z.string(),
  description: z.string(),
  suggestedPoints: z.number().nullable(),
  acceptanceCriteria: z.array(z.string()),
});

export type GeneratedStory = z.infer<typeof GeneratedStorySchema>;

export const GeneratedEpicSchema = z.object({
  title: z.string(),
  description: z.string(),
  stories: z.array(GeneratedStorySchema),
});

export type GeneratedEpic = z.infer<typeof GeneratedEpicSchema>;

export const GenerateEpicsStoriesRequestSchema = z.object({
  versionId: z.string().uuid(),
  compiledSpecification: z.string(),
  useCaseName: z.string(),
  versionName: z.string(),
  additionalContext: z.string().optional(),
});

export type GenerateEpicsStoriesRequest = z.infer<typeof GenerateEpicsStoriesRequestSchema>;

export const GenerateEpicsStoriesResponseSchema = z.object({
  success: z.boolean(),
  epics: z.array(GeneratedEpicSchema).nullable(),
  error: z.string().nullable(),
});

export type GenerateEpicsStoriesResponse = z.infer<typeof GenerateEpicsStoriesResponseSchema>;

// Export options
export const PlanningExportOptionsSchema = z.object({
  format: z.enum(['json', 'csv', 'jira']),
  includeAcceptanceCriteria: z.boolean().default(true),
  includeStoryPoints: z.boolean().default(true),
});

export type PlanningExportOptions = z.infer<typeof PlanningExportOptionsSchema>;

// Helper functions
export function calculateEpicPoints(epic: Epic): number {
  return epic.stories.reduce((sum, story) => sum + (story.storyPoints ?? 0), 0);
}

export function calculateVersionPoints(version: PlanningVersion): number {
  return version.epics.reduce((sum, epic) => sum + calculateEpicPoints(epic), 0);
}

export function countVersionStories(version: PlanningVersion): number {
  return version.epics.reduce((sum, epic) => sum + epic.stories.length, 0);
}

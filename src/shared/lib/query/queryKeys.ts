/**
 * Type-safe query key factory
 *
 * Usage:
 *   queryKeys.solutions.all         -> ['solutions']
 *   queryKeys.solutions.list(teamId) -> ['solutions', 'list', teamId]
 *   queryKeys.solutions.detail(id)   -> ['solutions', 'detail', id]
 */
export const queryKeys = {
  // Product Management
  solutions: {
    all: ['solutions'] as const,
    list: (teamId: string) => [...queryKeys.solutions.all, 'list', teamId] as const,
    detail: (id: string) => [...queryKeys.solutions.all, 'detail', id] as const,
  },
  solutionFactors: {
    all: ['solutionFactors'] as const,
    bySolution: (solutionId: string) =>
      [...queryKeys.solutionFactors.all, 'bySolution', solutionId] as const,
    bySolutionAndType: (solutionId: string, type: string) =>
      [...queryKeys.solutionFactors.all, 'bySolutionAndType', solutionId, type] as const,
    detail: (id: string) => [...queryKeys.solutionFactors.all, 'detail', id] as const,
  },
  personas: {
    all: ['personas'] as const,
    list: (teamId: string) => [...queryKeys.personas.all, 'list', teamId] as const,
    listPaginated: <T extends object>(params: T) =>
      [...queryKeys.personas.all, 'list', 'paginated', params] as const,
    detail: (id: string) => [...queryKeys.personas.all, 'detail', id] as const,
    similar: <T extends object | null>(request: T) =>
      [...queryKeys.personas.all, 'similar', request] as const,
  },
  useCases: {
    all: ['useCases'] as const,
    listByTeam: (teamId: string, unassignedOnly = false) =>
      [...queryKeys.useCases.all, 'list', 'team', teamId, unassignedOnly] as const,
    listBySolution: (solutionId: string) =>
      [...queryKeys.useCases.all, 'list', 'solution', solutionId] as const,
    listPaginated: <T extends object>(params: T) =>
      [...queryKeys.useCases.all, 'list', 'paginated', params] as const,
    detail: (id: string) => [...queryKeys.useCases.all, 'detail', id] as const,
  },
  requirements: {
    all: ['requirements'] as const,
    list: (useCaseId: string) => [...queryKeys.requirements.all, 'list', useCaseId] as const,
    detail: (id: string) => [...queryKeys.requirements.all, 'detail', id] as const,
  },
  organizations: {
    all: ['organizations'] as const,
    list: () => [...queryKeys.organizations.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.organizations.all, 'detail', id] as const,
  },
  teams: {
    all: ['teams'] as const,
    list: (organizationId: string) => [...queryKeys.teams.all, 'list', organizationId] as const,
    detail: (id: string) => [...queryKeys.teams.all, 'detail', id] as const,
  },
  users: {
    all: ['users'] as const,
    list: (teamId: string) => [...queryKeys.users.all, 'list', teamId] as const,
    detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
  },
  // Discovery
  feedbacks: {
    all: ['feedbacks'] as const,
    list: (teamId: string) => [...queryKeys.feedbacks.all, 'list', teamId] as const,
    listPaginated: <T extends object>(params: T) =>
      [...queryKeys.feedbacks.all, 'list', 'paginated', params] as const,
    detail: (id: string) => [...queryKeys.feedbacks.all, 'detail', id] as const,
    withChildren: (id: string) => [...queryKeys.feedbacks.all, 'withChildren', id] as const,
  },
  tags: {
    all: ['tags'] as const,
    list: (teamId: string) => [...queryKeys.tags.all, 'list', teamId] as const,
  },
  outcomes: {
    all: ['outcomes'] as const,
    list: (teamId: string) => [...queryKeys.outcomes.all, 'list', teamId] as const,
    listPaginated: <T extends object>(params: T) =>
      [...queryKeys.outcomes.all, 'list', 'paginated', params] as const,
    detail: (id: string) => [...queryKeys.outcomes.all, 'detail', id] as const,
  },
  intakeSources: {
    all: ['intakeSources'] as const,
    list: (teamId: string) => [...queryKeys.intakeSources.all, 'list', teamId] as const,
    detail: (id: string) => [...queryKeys.intakeSources.all, 'detail', id] as const,
  },

  // Design Studio
  diagrams: {
    all: ['diagrams'] as const,
    list: (designWorkId: string) => [...queryKeys.diagrams.all, 'list', designWorkId] as const,
    detail: (id: string) => [...queryKeys.diagrams.all, 'detail', id] as const,
  },
  designWorks: {
    all: ['designWorks'] as const,
    list: (solutionId: string) => [...queryKeys.designWorks.all, 'list', solutionId] as const,
    listByUseCase: (solutionId: string, useCaseId: string) =>
      [...queryKeys.designWorks.all, 'listByUseCase', solutionId, useCaseId] as const,
    detail: (id: string) => [...queryKeys.designWorks.all, 'detail', id] as const,
  },
  documents: {
    all: ['documents'] as const,
    list: (designWorkId: string) => [...queryKeys.documents.all, 'list', designWorkId] as const,
    detail: (id: string) => [...queryKeys.documents.all, 'detail', id] as const,
  },
  interfaces: {
    all: ['interfaces'] as const,
    list: (designWorkId: string) => [...queryKeys.interfaces.all, 'list', designWorkId] as const,
    detail: (id: string) => [...queryKeys.interfaces.all, 'detail', id] as const,
  },
  references: {
    all: ['references'] as const,
    list: (designWorkId: string) => [...queryKeys.references.all, 'list', designWorkId] as const,
    detail: (id: string) => [...queryKeys.references.all, 'detail', id] as const,
  },

  // Planning
  planning: {
    all: ['planning'] as const,
    versions: (solutionId: string) => [...queryKeys.planning.all, 'versions', solutionId] as const,
  },
  epics: {
    all: ['epics'] as const,
    byVersion: (versionId: string) => [...queryKeys.epics.all, 'byVersion', versionId] as const,
    detail: (id: string) => [...queryKeys.epics.all, 'detail', id] as const,
  },
  stories: {
    all: ['stories'] as const,
    byEpic: (epicId: string) => [...queryKeys.stories.all, 'byEpic', epicId] as const,
    detail: (id: string) => [...queryKeys.stories.all, 'detail', id] as const,
  },
  acceptanceCriteria: {
    all: ['acceptanceCriteria'] as const,
    byStory: (storyId: string) => [...queryKeys.acceptanceCriteria.all, 'byStory', storyId] as const,
  },

  // Auth
  auth: {
    currentUser: ['auth', 'currentUser'] as const,
  },
} as const;

/**
 * Helper type to extract query key types
 */
export type QueryKeys = typeof queryKeys;

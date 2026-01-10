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
  solutionOverviews: {
    all: ['solutionOverviews'] as const,
    bySolution: (solutionId: string) =>
      [...queryKeys.solutionOverviews.all, 'bySolution', solutionId] as const,
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
  personaUseCases: {
    all: ['personaUseCases'] as const,
    list: (personaId: string) => [...queryKeys.personaUseCases.all, 'list', personaId] as const,
    byUseCase: (useCaseId: string) => [...queryKeys.personaUseCases.all, 'byUseCase', useCaseId] as const,
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
  outcomes: {
    all: ['outcomes'] as const,
    list: (teamId: string) => [...queryKeys.outcomes.all, 'list', teamId] as const,
    listPaginated: <T extends object>(params: T) =>
      [...queryKeys.outcomes.all, 'list', 'paginated', params] as const,
    detail: (id: string) => [...queryKeys.outcomes.all, 'detail', id] as const,
  },
  feedbackPersonas: {
    all: ['feedbackPersonas'] as const,
    byFeedback: (feedbackId: string) => [...queryKeys.feedbackPersonas.all, 'byFeedback', feedbackId] as const,
    byPersona: (personaId: string) => [...queryKeys.feedbackPersonas.all, 'byPersona', personaId] as const,
  },
  feedbackUseCases: {
    all: ['feedbackUseCases'] as const,
    byFeedback: (feedbackId: string) => [...queryKeys.feedbackUseCases.all, 'byFeedback', feedbackId] as const,
    byUseCase: (useCaseId: string) => [...queryKeys.feedbackUseCases.all, 'byUseCase', useCaseId] as const,
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

  // Auth
  auth: {
    currentUser: ['auth', 'currentUser'] as const,
  },
} as const;

/**
 * Helper type to extract query key types
 */
export type QueryKeys = typeof queryKeys;

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
  personas: {
    all: ['personas'] as const,
    list: (teamId: string) => [...queryKeys.personas.all, 'list', teamId] as const,
    detail: (id: string) => [...queryKeys.personas.all, 'detail', id] as const,
  },
  useCases: {
    all: ['useCases'] as const,
    list: (solutionId: string) => [...queryKeys.useCases.all, 'list', solutionId] as const,
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

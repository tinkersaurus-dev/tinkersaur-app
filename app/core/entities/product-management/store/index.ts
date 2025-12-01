/**
 * Solution Management Entity Store Exports
 */

// Individual entity stores
export { useOrganizationStore } from './organization/useOrganizationStore';
export { useTeamStore } from './team/useTeamStore';
export { useUserStore } from './user/useUserStore';
export { useSolutionStore } from './solution/useSolutionStore';
export { usePersonaStore } from './persona/usePersonaStore';
export { usePersonaUseCaseStore } from './personaUseCase/usePersonaUseCaseStore';
// Note: useUseCaseStore, useChangeStore, and useRequirementStore are not exported here
// to avoid conflicts with dynamic imports used for circular dependency resolution.
// Import directly from their respective files when needed.

// Store factory (for advanced use cases)
export { createEntityStore } from './createEntityStore';
export type { EntityApi, EntityStoreState, EntityStoreActions, EntityStore } from './createEntityStore';

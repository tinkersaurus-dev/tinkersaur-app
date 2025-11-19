/**
 * Solution Management Entity Store Exports
 */

// Individual entity stores
export { useSolutionStore } from './solution/useSolutionStore';
export { useFeatureStore } from './feature/useFeatureStore';
export { useChangeStore } from './change/useChangeStore';
export { useRequirementStore } from './requirement/useRequirementStore';

// Store factory (for advanced use cases)
export { createEntityStore } from './createEntityStore';
export type { EntityApi, EntityStoreState, EntityStoreActions, EntityStore } from './createEntityStore';

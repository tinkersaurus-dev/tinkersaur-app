/**
 * Re-export TanStack Query hooks for Diagram entity
 * These hooks are defined in the app layer but re-exported here for convenience
 */

export {
  useDiagramsQuery,
  useDiagramQuery,
  prefetchDiagrams,
  prefetchDiagram,
} from '~/design-studio/queries';

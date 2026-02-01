/**
 * Re-export TanStack Query hooks for DesignWork entity
 * These hooks are defined in the app layer but re-exported here for convenience
 */

export {
  useDesignWorksQuery,
  useDesignWorksWithContentQuery,
  useDesignWorksWithContentByUseCaseQuery,
  useDesignWorkQuery,
  prefetchDesignWorks,
  prefetchDesignWork,
} from '~/design-studio/queries';

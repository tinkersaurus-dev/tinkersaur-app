/**
 * Design Studio Query Hooks
 *
 * TanStack Query hooks for fetching design studio entities with
 * automatic caching, background refresh, and SSR support.
 */

export {
  useDiagramsQuery,
  useDiagramQuery,
  prefetchDiagrams,
  prefetchDiagram,
} from './useDiagramQuery';

export {
  useDesignWorksQuery,
  useDesignWorksWithContentQuery,
  useDesignWorkQuery,
  prefetchDesignWorks,
  prefetchDesignWork,
} from './useDesignWorkQuery';

export {
  useDocumentsQuery,
  useDocumentQuery,
  prefetchDocuments,
  prefetchDocument,
} from './useDocumentQuery';

export {
  useInterfacesQuery,
  useInterfaceQuery,
  prefetchInterfaces,
  prefetchInterface,
} from './useInterfaceQuery';

export {
  useReferencesQuery,
  useReferenceQuery,
  prefetchReferences,
  prefetchReference,
} from './useReferenceQuery';

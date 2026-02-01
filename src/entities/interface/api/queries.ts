/**
 * Re-export TanStack Query hooks for Interface entity
 * These hooks are defined in the app layer but re-exported here for convenience
 */

export {
  useInterfacesQuery,
  useInterfaceQuery,
  prefetchInterfaces,
  prefetchInterface,
} from '~/design-studio/queries';

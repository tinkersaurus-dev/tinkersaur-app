import { create, type StoreApi } from 'zustand';
import { toast } from 'sonner';
import { createEntityStore, type EntityApi, type EntityStore } from './createEntityStore';

/**
 * Configuration for creating a store wrapper
 */
export interface StoreWrapperConfig<T extends { id: string }, TCreate, TExtensions> {
  api: EntityApi<T, TCreate>;
  entityName: string;
  deleteHandler?: (
    id: string,
    baseStore: StoreApi<EntityStore<T, TCreate>>,
    api: EntityApi<T, TCreate>
  ) => Promise<boolean>;
  extensions?: (
    baseStore: StoreApi<EntityStore<T, TCreate>>,
    get: () => EntityStore<T, TCreate> & TExtensions
  ) => TExtensions;
}

/**
 * Factory function to create a Zustand store wrapper with proxy pattern
 *
 * This eliminates boilerplate by automatically:
 * - Creating a base entity store
 * - Proxying state (entities, loading, error)
 * - Proxying methods (fetchAll, fetchById, create, update, setEntities, reset)
 * - Setting up subscription to keep wrapper in sync
 * - Allowing custom delete handlers for cascade logic
 * - Allowing extensions for convenience methods
 */
export function createStoreWrapper<T extends { id: string }, TCreate, TExtensions = object>(
  config: StoreWrapperConfig<T, TCreate, TExtensions>
) {
  const { api, entityName, deleteHandler, extensions } = config;

  const baseStore = createEntityStore<T, TCreate>(api, entityName);

  type WrapperStore = EntityStore<T, TCreate> & TExtensions;

  const useStore = create<WrapperStore>((_set, get) => {
    const baseProxy: EntityStore<T, TCreate> = {
      // State proxies
      get entities() { return baseStore.getState().entities; },
      get loading() { return baseStore.getState().loading; },
      get error() { return baseStore.getState().error; },

      // Method proxies
      fetchAll: (...args) => baseStore.getState().fetchAll(...args),
      fetchById: (...args) => baseStore.getState().fetchById(...args),
      create: (...args) => baseStore.getState().create(...args),
      update: (...args) => baseStore.getState().update(...args),
      setEntities: (...args) => baseStore.getState().setEntities(...args),
      reset: () => baseStore.getState().reset(),

      // Delete - use custom handler or default
      delete: deleteHandler
        ? async (id: string): Promise<boolean> => {
            baseStore.setState({ loading: true, error: null });
            try {
              const success = await deleteHandler(id, baseStore, api);
              if (success) {
                toast.success(`${entityName} deleted successfully`);
              } else {
                toast.error(`Failed to delete ${entityName.toLowerCase()}`);
              }
              baseStore.setState({ loading: false });
              return success;
            } catch (error) {
              const err = error instanceof Error ? error : new Error(`Failed to delete ${entityName.toLowerCase()}`);
              baseStore.setState({ error: err, loading: false });
              toast.error(`Failed to delete ${entityName.toLowerCase()}`);
              return false;
            }
          }
        : (...args) => baseStore.getState().delete(...args),
    };

    const extensionMethods = extensions
      ? extensions(baseStore, get as () => WrapperStore)
      : ({} as TExtensions);

    return {
      ...baseProxy,
      ...extensionMethods,
    } as WrapperStore;
  });

  // Subscribe to base store changes to keep wrapper in sync
  baseStore.subscribe((state) => {
    useStore.setState({
      entities: state.entities,
      loading: state.loading,
      error: state.error,
    } as Partial<WrapperStore>);
  });

  return useStore;
}

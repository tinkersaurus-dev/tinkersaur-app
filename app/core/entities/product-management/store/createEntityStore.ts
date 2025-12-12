import { create } from 'zustand';
import { toast } from 'sonner';

// Track in-flight requests to prevent duplicate API calls
// Key format: "storeName:method:args" -> Promise
const inFlightRequests = new Map<string, Promise<unknown>>();

/**
 * Generic API interface that all entity APIs should conform to
 */
export interface EntityApi<T, TCreate> {
  list: (parentId?: string) => Promise<T[]>;
  get: (id: string) => Promise<T | null>;
  create: (data: TCreate) => Promise<T>;
  update: (id: string, updates: Partial<T>) => Promise<T | null>;
  delete: (id: string) => Promise<boolean>;
}

/**
 * Creates a unique key for tracking in-flight requests
 */
const createRequestKey = (storeName: string, method: string, ...args: unknown[]) =>
  `${storeName}:${method}:${JSON.stringify(args)}`;

/**
 * Base state shape for entity stores
 */
export interface EntityStoreState<T> {
  entities: T[];
  loading: boolean;
  error: Error | null;
}

/**
 * Base actions shape for entity stores
 */
export interface EntityStoreActions<T, TCreate> {
  fetchAll: (parentId?: string) => Promise<void>;
  fetchById: (id: string) => Promise<T | null>;
  create: (data: TCreate) => Promise<T | null>;
  update: (id: string, updates: Partial<T>) => Promise<T | null>;
  delete: (id: string) => Promise<boolean>;
  setEntities: (entities: T[]) => void;
  reset: () => void;
}

/**
 * Combined store type
 */
export type EntityStore<T, TCreate> = EntityStoreState<T> & EntityStoreActions<T, TCreate>;

/**
 * Factory function to create a Zustand store for an entity type
 *
 * @param api - The API client for the entity
 * @param entityName - Human-readable entity name for toast messages (e.g., "Solution", "Feature")
 * @returns A Zustand store hook with standard CRUD operations
 *
 * @example
 * const useSolutionStore = createEntityStore(
 *   solutionApi,
 *   'Solution'
 * );
 */
export function createEntityStore<T extends { id: string }, TCreate>(
  api: EntityApi<T, TCreate>,
  entityName: string
) {
  const initialState: EntityStoreState<T> = {
    entities: [],
    loading: false,
    error: null,
  };

  return create<EntityStore<T, TCreate>>((set, get) => ({
    ...initialState,

    /**
     * Fetch all entities, optionally filtered by parent ID
     */
    fetchAll: async (parentId?: string) => {
      const requestKey = createRequestKey(entityName, 'fetchAll', parentId);

      // Return existing promise if request is in-flight
      const existing = inFlightRequests.get(requestKey);
      if (existing) {
        await existing;
        return;
      }

      set({ loading: true, error: null });

      const promise = api.list(parentId)
        .then((entities) => {
          set({ entities, loading: false });
        })
        .catch((error) => {
          const err = error instanceof Error ? error : new Error(`Failed to fetch ${entityName.toLowerCase()}s`);
          set({ error: err, loading: false });
          toast.error(`Failed to load ${entityName.toLowerCase()}s`);
        })
        .finally(() => {
          inFlightRequests.delete(requestKey);
        });

      inFlightRequests.set(requestKey, promise);
      await promise;
    },

    /**
     * Fetch a single entity by ID
     */
    fetchById: async (id: string) => {
      const requestKey = createRequestKey(entityName, 'fetchById', id);

      // Return existing promise if request is in-flight
      const existing = inFlightRequests.get(requestKey);
      if (existing) {
        return existing as Promise<T | null>;
      }

      set({ loading: true, error: null });

      const promise = api.get(id)
        .then((entity) => {
          if (entity) {
            // Update or add to entities array
            const entities = get().entities;
            const index = entities.findIndex(e => e.id === id);

            if (index >= 0) {
              const updated = [...entities];
              updated[index] = entity;
              set({ entities: updated, loading: false });
            } else {
              set({ entities: [...entities, entity], loading: false });
            }
          } else {
            set({ loading: false });
          }
          return entity;
        })
        .catch((error) => {
          const err = error instanceof Error ? error : new Error(`Failed to fetch ${entityName.toLowerCase()}`);
          set({ error: err, loading: false });
          toast.error(`Failed to load ${entityName.toLowerCase()}`);
          return null;
        })
        .finally(() => {
          inFlightRequests.delete(requestKey);
        });

      inFlightRequests.set(requestKey, promise);
      return promise;
    },

    /**
     * Create a new entity
     */
    create: async (data: TCreate) => {
      set({ loading: true, error: null });
      try {
        const newEntity = await api.create(data);
        set({
          entities: [...get().entities, newEntity],
          loading: false
        });
        toast.success(`${entityName} created successfully`);
        return newEntity;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(`Failed to create ${entityName.toLowerCase()}`);
        set({ error: err, loading: false });
        toast.error(`Failed to create ${entityName.toLowerCase()}`);
        return null;
      }
    },

    /**
     * Update an existing entity
     */
    update: async (id: string, updates: Partial<T>) => {
      set({ loading: true, error: null });
      try {
        const updated = await api.update(id, updates);

        if (updated) {
          const entities = get().entities;
          const index = entities.findIndex(e => e.id === id);

          if (index >= 0) {
            const newEntities = [...entities];
            newEntities[index] = updated;
            set({ entities: newEntities, loading: false });
          } else {
            set({ loading: false });
          }

          toast.success(`${entityName} updated successfully`);
        } else {
          set({ loading: false });
          toast.error(`${entityName} not found`);
        }

        return updated;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(`Failed to update ${entityName.toLowerCase()}`);
        set({ error: err, loading: false });
        toast.error(`Failed to update ${entityName.toLowerCase()}`);
        return null;
      }
    },

    /**
     * Delete an entity
     */
    delete: async (id: string) => {
      set({ loading: true, error: null });
      try {
        const success = await api.delete(id);

        if (success) {
          set({
            entities: get().entities.filter(e => e.id !== id),
            loading: false
          });
          toast.success(`${entityName} deleted successfully`);
        } else {
          set({ loading: false });
          toast.error(`Failed to delete ${entityName.toLowerCase()}`);
        }

        return success;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(`Failed to delete ${entityName.toLowerCase()}`);
        set({ error: err, loading: false });
        toast.error(`Failed to delete ${entityName.toLowerCase()}`);
        return false;
      }
    },

    /**
     * Manually set the entities array (useful for cascade operations)
     */
    setEntities: (entities: T[]) => {
      set({ entities });
    },

    /**
     * Reset store to initial state
     */
    reset: () => {
      set(initialState);
    },
  }));
}

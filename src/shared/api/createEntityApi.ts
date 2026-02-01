import { httpClient, deserializeDates, deserializeDatesArray } from './httpClient';
import type { PaginatedResponse } from './types';

// ============================================
// Configuration Types
// ============================================

interface EntityApiConfig<TExtensions = Record<string, never>> {
  endpoint: string;
  parentParam?: string;
  extensions?: (
    baseApi: EntityApi<unknown, unknown>,
    config: { endpoint: string; parentParam?: string }
  ) => TExtensions;
}

interface PaginatedEntityApiConfig<TListParams, TExtensions = Record<string, never>>
  extends Omit<EntityApiConfig<TExtensions>, 'extensions'> {
  paginationDefaults?: {
    pageSize?: number;
  };
  extensions?: (
    baseApi: PaginatedEntityApi<unknown, unknown, TListParams>,
    config: { endpoint: string; parentParam?: string }
  ) => TExtensions;
}

// ============================================
// API Interface Types
// ============================================

export interface EntityApi<T, TCreate> {
  list(parentId?: string): Promise<T[]>;
  get(id: string): Promise<T>;
  create(data: TCreate): Promise<T>;
  update(id: string, updates: Partial<TCreate>): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface PaginatedEntityApi<T, TCreate, TListParams> extends EntityApi<T, TCreate> {
  listPaginated(params: TListParams): Promise<PaginatedResponse<T>>;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Builds URLSearchParams from a params object, handling arrays and optional values
 */
export function buildSearchParams<T extends Record<string, unknown>>(params: T): URLSearchParams {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      // Handle arrays (e.g., personaIds: ['a', 'b'] → personaIds=a&personaIds=b)
      for (const item of value) {
        if (item !== undefined && item !== null) {
          searchParams.append(key, String(item));
        }
      }
    } else {
      searchParams.set(key, String(value));
    }
  }

  return searchParams;
}

// ============================================
// Factory Functions
// ============================================

/**
 * Creates a standard CRUD API for an entity
 *
 * @example
 * // Simple CRUD API
 * const teamApi = createEntityApi<Team, CreateTeamDto>({
 *   endpoint: '/api/teams',
 *   parentParam: 'organizationId',
 * });
 *
 * @example
 * // With extensions
 * const documentApi = createEntityApi<Document, CreateDocumentDto>({
 *   endpoint: '/api/documents',
 *   parentParam: 'designWorkId',
 *   extensions: (baseApi, config) => ({
 *     async deleteByDesignWorkId(designWorkId: string): Promise<void> {
 *       await httpClient.delete(`${config.endpoint}?designWorkId=${designWorkId}`);
 *     },
 *   }),
 * });
 */
export function createEntityApi<
  T extends Record<string, unknown>,
  TCreate,
  TExtensions extends Record<string, unknown> = Record<string, never>,
>(config: EntityApiConfig<TExtensions>): EntityApi<T, TCreate> & TExtensions {
  const { endpoint, parentParam, extensions } = config;

  const baseApi: EntityApi<T, TCreate> = {
    async list(parentId?: string): Promise<T[]> {
      if (parentParam && !parentId) return [];
      const url =
        parentParam && parentId ? `${endpoint}?${parentParam}=${parentId}` : endpoint;
      const data = await httpClient.get<T[]>(url);
      return deserializeDatesArray(data);
    },

    async get(id: string): Promise<T> {
      const data = await httpClient.get<T>(`${endpoint}/${id}`);
      return deserializeDates(data);
    },

    async create(data: TCreate): Promise<T> {
      const result = await httpClient.post<T>(endpoint, data);
      return deserializeDates(result);
    },

    async update(id: string, updates: Partial<TCreate>): Promise<T> {
      const result = await httpClient.put<T>(`${endpoint}/${id}`, updates);
      return deserializeDates(result);
    },

    async delete(id: string): Promise<void> {
      await httpClient.delete(`${endpoint}/${id}`);
    },
  };

  if (extensions) {
    const extensionMethods = extensions(baseApi as EntityApi<unknown, unknown>, {
      endpoint,
      parentParam,
    });
    return { ...baseApi, ...extensionMethods } as EntityApi<T, TCreate> & TExtensions;
  }

  return baseApi as EntityApi<T, TCreate> & TExtensions;
}

/**
 * Creates a paginated CRUD API for entities that support list pagination
 *
 * @example
 * const personaApi = createPaginatedEntityApi<Persona, CreatePersonaDto, PersonaListParams>({
 *   endpoint: '/api/personas',
 *   parentParam: 'teamId',
 *   extensions: (baseApi, config) => ({
 *     async findSimilar(request: FindSimilarRequest): Promise<SimilarResult[]> {
 *       const data = await httpClient.post<SimilarResult[]>(`${config.endpoint}/similar`, request);
 *       return data.map(r => ({ ...r, persona: deserializeDates(r.persona) }));
 *     },
 *     async merge(request: MergeRequest): Promise<Persona> {
 *       const result = await httpClient.post<Persona>(`${config.endpoint}/merge`, request);
 *       return deserializeDates(result);
 *     },
 *   }),
 * });
 */
export function createPaginatedEntityApi<
  T extends Record<string, unknown>,
  TCreate,
  TListParams extends object,
  TExtensions extends Record<string, unknown> = Record<string, never>,
>(
  config: PaginatedEntityApiConfig<TListParams, TExtensions>
): PaginatedEntityApi<T, TCreate, TListParams> & TExtensions {
  const { endpoint, parentParam, paginationDefaults, extensions } = config;

  // Create base CRUD API
  const crudApi = createEntityApi<T, TCreate>({ endpoint, parentParam });

  const paginatedApi: PaginatedEntityApi<T, TCreate, TListParams> = {
    ...crudApi,

    async listPaginated(params: TListParams): Promise<PaginatedResponse<T>> {
      const paramsObj = params as Record<string, unknown>;
      const paramsWithDefaults = {
        ...paramsObj,
        pageSize: paramsObj.pageSize ?? paginationDefaults?.pageSize,
      };

      const searchParams = buildSearchParams(paramsWithDefaults);
      const data = await httpClient.get<PaginatedResponse<T>>(
        `${endpoint}?${searchParams.toString()}`
      );

      return {
        ...data,
        items: deserializeDatesArray(data.items),
      };
    },
  };

  if (extensions) {
    const extensionMethods = extensions(
      paginatedApi as PaginatedEntityApi<unknown, unknown, TListParams>,
      { endpoint, parentParam }
    );
    return {
      ...paginatedApi,
      ...extensionMethods,
    } as PaginatedEntityApi<T, TCreate, TListParams> & TExtensions;
  }

  return paginatedApi as PaginatedEntityApi<T, TCreate, TListParams> & TExtensions;
}

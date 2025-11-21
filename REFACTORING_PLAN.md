# Tinkersaur App - Refactoring Plan: Error Architecture + Async State Pattern

This plan focuses on establishing a solid error handling foundation, then building standardized async state management on top of it.

---

## Sprint 1: Error Type System & Result Pattern

### 1.1 Create Error Type Hierarchy
**File**: `app/core/lib/errors/RepositoryError.ts`

```typescript
// Base error class
export abstract class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Specific error types (aligned with future HTTP status codes)
export class NotFoundError extends RepositoryError {
  constructor(entityType: string, id: string) {
    super(
      `${entityType} with id '${id}' not found`,
      'NOT_FOUND',
      404,
      { entityType, id }
    );
  }
}

export class ValidationError extends RepositoryError {
  constructor(message: string, fields?: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', 400, { fields });
  }
}

export class NetworkError extends RepositoryError {
  constructor(message: string, cause?: Error) {
    super(message, 'NETWORK_ERROR', 503, { cause });
  }
}

export class UnauthorizedError extends RepositoryError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ConflictError extends RepositoryError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}

export class InternalError extends RepositoryError {
  constructor(message: string, cause?: Error) {
    super(message, 'INTERNAL_ERROR', 500, { cause });
  }
}
```

### 1.2 Enhance Result Type
**File**: `app/core/lib/utils/result.ts`

```typescript
// Generic Result type (already exists, enhance it)
export type Result<T, E = RepositoryError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Convenience constructors
export function ok<T, E = RepositoryError>(value: T): Result<T, E> {
  return { ok: true, value };
}

export function err<T = never, E = RepositoryError>(error: E): Result<T, E> {
  return { ok: false, error };
}

// Helper to unwrap or throw
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) return result.value;
  throw result.error;
}

// Helper to map successful results
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}

// Helper to handle errors
export function mapError<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  return result.ok ? result : err(fn(result.error));
}

// Helper to chain operations
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  return result.ok ? fn(result.value) : result;
}

// Helper to match on result
export function match<T, E, U>(
  result: Result<T, E>,
  handlers: {
    ok: (value: T) => U;
    err: (error: E) => U;
  }
): U {
  return result.ok ? handlers.ok(result.value) : handlers.err(result.error);
}
```

### 1.3 Create Repository Interface with Result Types
**File**: `app/core/data/repositories/IEntityRepository.ts`

```typescript
import { Result } from '~/core/lib/utils/result';
import { RepositoryError } from '~/core/lib/errors/RepositoryError';

export interface IEntityRepository<T, CreateDTO, UpdateDTO> {
  // List operations never fail (return empty array)
  list(parentId: string): Promise<T[]>;

  // Get operations return Result (NotFoundError if not found)
  get(id: string): Promise<Result<T, RepositoryError>>;

  // Create operations return Result (ValidationError if invalid)
  create(data: CreateDTO): Promise<Result<T, RepositoryError>>;

  // Update operations return Result (NotFoundError or ValidationError)
  update(id: string, updates: UpdateDTO): Promise<Result<T, RepositoryError>>;

  // Delete operations return Result (NotFoundError if not found)
  delete(id: string): Promise<Result<boolean, RepositoryError>>;
}
```

**Deliverables**: Error type system, enhanced Result utilities, repository contracts

---

## Sprint 2: Implement Result Pattern in Repositories

### 2.1 Create Base LocalStorage Repository
**File**: `app/core/data/repositories/localStorage/BaseLocalStorageRepository.ts`

```typescript
import { Result, ok, err } from '~/core/lib/utils/result';
import { NotFoundError, ValidationError, InternalError } from '~/core/lib/errors/RepositoryError';
import { IEntityRepository } from '../IEntityRepository';

export abstract class BaseLocalStorageRepository<T extends { id: string }, CreateDTO, UpdateDTO>
  implements IEntityRepository<T, CreateDTO, UpdateDTO> {

  protected abstract storageKey: string;
  protected abstract entityName: string;
  protected abstract storagePrefix: string;

  // Simulate network delay (will help with testing loading states)
  protected async simulateDelay(ms: number = 100): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  // Safe storage operations with error handling
  protected getFromStorage(): T[] {
    try {
      const key = `${this.storagePrefix}${this.storageKey}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Failed to read from localStorage: ${this.storageKey}`, error);
      return [];
    }
  }

  protected saveToStorage(data: T[]): Result<void, InternalError> {
    try {
      const key = `${this.storagePrefix}${this.storageKey}`;
      localStorage.setItem(key, JSON.stringify(data));
      return ok(undefined);
    } catch (error) {
      return err(new InternalError(
        `Failed to save ${this.entityName}`,
        error instanceof Error ? error : undefined
      ));
    }
  }

  // Standard CRUD with Result types
  async list(parentId: string): Promise<T[]> {
    await this.simulateDelay();
    const items = this.getFromStorage();
    return this.filterByParent(items, parentId);
  }

  async get(id: string): Promise<Result<T, NotFoundError>> {
    await this.simulateDelay();
    const items = this.getFromStorage();
    const item = items.find(i => i.id === id);

    return item
      ? ok(item)
      : err(new NotFoundError(this.entityName, id));
  }

  async create(data: CreateDTO): Promise<Result<T, ValidationError | InternalError>> {
    await this.simulateDelay();

    // Validate (hook for subclasses)
    const validationResult = this.validate(data);
    if (!validationResult.ok) return validationResult;

    // Create entity with metadata
    const entity = this.buildEntity(data);

    // Save to storage
    const items = this.getFromStorage();
    items.push(entity);
    const saveResult = this.saveToStorage(items);

    return saveResult.ok ? ok(entity) : saveResult;
  }

  async update(id: string, updates: UpdateDTO): Promise<Result<T, NotFoundError | InternalError>> {
    await this.simulateDelay();

    const items = this.getFromStorage();
    const index = items.findIndex(i => i.id === id);

    if (index === -1) {
      return err(new NotFoundError(this.entityName, id));
    }

    // Apply updates
    items[index] = this.applyUpdates(items[index], updates);

    const saveResult = this.saveToStorage(items);
    return saveResult.ok ? ok(items[index]) : saveResult;
  }

  async delete(id: string): Promise<Result<boolean, NotFoundError | InternalError>> {
    await this.simulateDelay();

    const items = this.getFromStorage();
    const filteredItems = items.filter(i => i.id !== id);

    if (filteredItems.length === items.length) {
      return err(new NotFoundError(this.entityName, id));
    }

    const saveResult = this.saveToStorage(filteredItems);
    return saveResult.ok ? ok(true) : saveResult;
  }

  // Hooks for subclasses to override
  protected abstract filterByParent(items: T[], parentId: string): T[];
  protected abstract buildEntity(data: CreateDTO): T;
  protected abstract applyUpdates(entity: T, updates: UpdateDTO): T;
  protected validate(data: CreateDTO): Result<void, ValidationError> {
    return ok(undefined); // Override in subclasses if needed
  }
}
```

### 2.2 Implement Solution Repository (Proof of Concept)
**File**: `app/core/data/repositories/localStorage/SolutionRepository.ts`

```typescript
import { v4 as uuidv4 } from 'uuid';
import { BaseLocalStorageRepository } from './BaseLocalStorageRepository';
import { Solution, CreateSolutionDto, UpdateSolutionDto } from '~/core/entities/product-management/types';

export class SolutionRepository extends BaseLocalStorageRepository<
  Solution,
  CreateSolutionDto,
  UpdateSolutionDto
> {
  protected storageKey = 'solutions';
  protected entityName = 'Solution';
  protected storagePrefix = 'tinkersaur_pm_';

  protected filterByParent(items: Solution[], organizationId: string): Solution[] {
    return items.filter(s => s.organizationId === organizationId);
  }

  protected buildEntity(data: CreateSolutionDto): Solution {
    return {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  protected applyUpdates(entity: Solution, updates: UpdateSolutionDto): Solution {
    return {
      ...entity,
      ...updates,
      id: entity.id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };
  }
}
```

### 2.3 Create Repository Provider
**File**: `app/core/data/repositories/index.ts`

```typescript
import { ISolutionRepository } from './ISolutionRepository';
import { SolutionRepository } from './localStorage/SolutionRepository';
// Import other repositories...

// Configuration for switching implementations
const USE_HTTP = import.meta.env.VITE_USE_HTTP_API === 'true';

// Export repository instances
export const repositories = {
  solution: new SolutionRepository() as ISolutionRepository,
  // Add others as they're migrated
} as const;

// For gradual migration, we can override per-entity
export function getRepository<T extends keyof typeof repositories>(
  entityType: T
): typeof repositories[T] {
  return repositories[entityType];
}
```

**Deliverables**: Base repository with Result pattern, one POC implementation, provider pattern

---

## Sprint 3: Async State Management Wrapper

### 3.1 Create Async Action Wrapper
**File**: `app/core/lib/state/asyncAction.ts`

```typescript
import { Result } from '~/core/lib/utils/result';
import { RepositoryError } from '~/core/lib/errors/RepositoryError';
import { toast } from 'react-hot-toast';

type LoadingState = Record<string, boolean>;
type ErrorState = Record<string, RepositoryError | null>;

interface AsyncActionConfig {
  loadingKey: string;
  errorMessage?: string;
  successMessage?: string;
  onError?: (error: RepositoryError) => void;
  onSuccess?: () => void;
}

/**
 * Wraps an async repository operation with automatic loading/error state management
 *
 * @example
 * ```typescript
 * fetchSolutions: async (orgId: string) => {
 *   return createAsyncAction(
 *     { set, get },
 *     { loadingKey: 'solutions', errorMessage: 'Failed to load solutions' },
 *     async () => {
 *       const solutions = await repositories.solution.list(orgId);
 *       set({ solutions });
 *       return ok(solutions);
 *     }
 *   );
 * }
 * ```
 */
export function createAsyncAction<T>(
  storeHelpers: {
    set: (fn: (state: any) => Partial<any>) => void;
    get: () => any;
  },
  config: AsyncActionConfig,
  action: () => Promise<Result<T, RepositoryError>>
): Promise<Result<T, RepositoryError>> {
  const { set } = storeHelpers;
  const { loadingKey, errorMessage, successMessage, onError, onSuccess } = config;

  // Set loading state
  set((state: any) => ({
    loading: { ...state.loading, [loadingKey]: true },
    errors: { ...state.errors, [loadingKey]: null },
  }));

  return action()
    .then((result) => {
      // Update loading state
      set((state: any) => ({
        loading: { ...state.loading, [loadingKey]: false },
      }));

      if (result.ok) {
        // Success
        if (successMessage) {
          toast.success(successMessage);
        }
        onSuccess?.();
      } else {
        // Error from Result
        set((state: any) => ({
          errors: { ...state.errors, [loadingKey]: result.error },
        }));

        if (errorMessage) {
          toast.error(errorMessage);
        }
        onError?.(result.error);
      }

      return result;
    })
    .catch((error) => {
      // Unexpected error (shouldn't happen with Result pattern, but safety net)
      const repositoryError = error instanceof RepositoryError
        ? error
        : new InternalError('Unexpected error', error);

      set((state: any) => ({
        loading: { ...state.loading, [loadingKey]: false },
        errors: { ...state.errors, [loadingKey]: repositoryError },
      }));

      if (errorMessage) {
        toast.error(errorMessage);
      }
      onError?.(repositoryError);

      return err(repositoryError);
    });
}

/**
 * Simpler version for operations that don't return data (delete, etc.)
 */
export function createAsyncVoidAction(
  storeHelpers: { set: any; get: any },
  config: AsyncActionConfig,
  action: () => Promise<Result<void, RepositoryError>>
): Promise<Result<void, RepositoryError>> {
  return createAsyncAction(storeHelpers, config, action);
}
```

### 3.2 Create React Hook for Async Operations
**File**: `app/core/lib/hooks/useAsyncOperation.ts`

```typescript
import { useState, useCallback } from 'react';
import { Result } from '~/core/lib/utils/result';
import { RepositoryError } from '~/core/lib/errors/RepositoryError';

interface UseAsyncOperationOptions {
  onSuccess?: () => void;
  onError?: (error: RepositoryError) => void;
}

/**
 * Hook for handling async operations with loading/error state in components
 *
 * @example
 * ```typescript
 * const { execute, loading, error } = useAsyncOperation({
 *   onSuccess: () => toast.success('Saved!'),
 * });
 *
 * const handleSave = () => {
 *   execute(async () => {
 *     return await updateSolution(id, data);
 *   });
 * };
 * ```
 */
export function useAsyncOperation<T>(options: UseAsyncOperationOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<RepositoryError | null>(null);

  const execute = useCallback(
    async (operation: () => Promise<Result<T, RepositoryError>>): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await operation();

        if (result.ok) {
          options.onSuccess?.();
          return result.value;
        } else {
          setError(result.error);
          options.onError?.(result.error);
          return null;
        }
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return { execute, loading, error, reset };
}
```

**Deliverables**: Reusable async state wrapper, component-level hook

---

## Sprint 4: Migrate One Store (Proof of Concept)

### 4.1 Update Solution Store to Use New Patterns
**File**: `app/core/entities/product-management/store/solution/useSolutionStore.ts` (new file)

```typescript
import { create } from 'zustand';
import { Solution, CreateSolutionDto, UpdateSolutionDto } from '../../types';
import { repositories } from '~/core/data/repositories';
import { createAsyncAction } from '~/core/lib/state/asyncAction';
import { ok, unwrap } from '~/core/lib/utils/result';
import { RepositoryError } from '~/core/lib/errors/RepositoryError';

interface SolutionStore {
  // State
  solutions: Solution[];
  loading: { solutions: boolean };
  errors: { solutions: RepositoryError | null };

  // Actions
  fetchSolutions: (organizationId: string) => Promise<void>;
  createSolution: (data: CreateSolutionDto) => Promise<Solution | null>;
  updateSolution: (id: string, updates: UpdateSolutionDto) => Promise<Solution | null>;
  deleteSolution: (id: string) => Promise<boolean>;
}

export const useSolutionStore = create<SolutionStore>((set, get) => ({
  // Initial state
  solutions: [],
  loading: { solutions: false },
  errors: { solutions: null },

  // Fetch solutions (list never fails, just returns empty)
  fetchSolutions: async (organizationId: string) => {
    return createAsyncAction(
      { set, get },
      {
        loadingKey: 'solutions',
        errorMessage: 'Failed to load solutions'
      },
      async () => {
        const solutions = await repositories.solution.list(organizationId);
        set({ solutions });
        return ok(solutions);
      }
    ).then(() => undefined); // Convert to void
  },

  // Create solution
  createSolution: async (data: CreateSolutionDto) => {
    const result = await createAsyncAction(
      { set, get },
      {
        loadingKey: 'solutions',
        successMessage: 'Solution created successfully',
        errorMessage: 'Failed to create solution'
      },
      async () => {
        const result = await repositories.solution.create(data);
        if (result.ok) {
          set((state) => ({
            solutions: [...state.solutions, result.value],
          }));
        }
        return result;
      }
    );

    return result.ok ? result.value : null;
  },

  // Update solution
  updateSolution: async (id: string, updates: UpdateSolutionDto) => {
    const result = await createAsyncAction(
      { set, get },
      {
        loadingKey: 'solutions',
        successMessage: 'Solution updated successfully',
        errorMessage: 'Failed to update solution'
      },
      async () => {
        const result = await repositories.solution.update(id, updates);
        if (result.ok) {
          set((state) => ({
            solutions: state.solutions.map((s) =>
              s.id === id ? result.value : s
            ),
          }));
        }
        return result;
      }
    );

    return result.ok ? result.value : null;
  },

  // Delete solution
  deleteSolution: async (id: string) => {
    const result = await createAsyncAction(
      { set, get },
      {
        loadingKey: 'solutions',
        successMessage: 'Solution deleted successfully',
        errorMessage: 'Failed to delete solution'
      },
      async () => {
        const result = await repositories.solution.delete(id);
        if (result.ok) {
          set((state) => ({
            solutions: state.solutions.filter((s) => s.id !== id),
          }));
        }
        return result;
      }
    );

    return result.ok ? result.value : false;
  },
}));
```

### 4.2 Update Components to Handle New Patterns
**Example**: Update component error handling

```typescript
// BEFORE:
const { fetchSolutions, errors } = useSolutionStore();

useEffect(() => {
  fetchSolutions(orgId);
}, [orgId, fetchSolutions]);

// Display error from store
{errors.solutions && <ErrorMessage error={errors.solutions} />}

// AFTER (same, but now errors are typed):
const { fetchSolutions, errors } = useSolutionStore();

useEffect(() => {
  fetchSolutions(orgId);
}, [orgId, fetchSolutions]);

// Now we can handle specific error types
{errors.solutions && (
  <ErrorMessage
    error={errors.solutions}
    retry={errors.solutions instanceof NetworkError ? () => fetchSolutions(orgId) : undefined}
  />
)}
```

**Deliverables**: One complete store using new patterns, validated approach

---

## Sprint 5: Structured Logging

### 5.1 Enhance Logger Utility
**File**: `app/core/utils/logger.ts` (enhance existing)

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogContext = Record<string, unknown>;

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, errorOrContext?: Error | LogContext, context?: LogContext) {
    const error = errorOrContext instanceof Error ? errorOrContext : undefined;
    const ctx = errorOrContext instanceof Error ? context : errorOrContext;
    this.log('error', message, ctx, error);
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      error,
    };

    // In development, use console with formatting
    if (this.isDevelopment) {
      const prefix = `[${entry.timestamp.toISOString()}] [${level.toUpperCase()}]`;
      const args = [prefix, message];

      if (context) args.push(context);
      if (error) args.push(error);

      console[level === 'debug' ? 'log' : level](...args);
    } else {
      // In production, send to logging service (future)
      this.sendToLoggingService(entry);
    }
  }

  private sendToLoggingService(entry: LogEntry) {
    // TODO: Send to actual logging service when available
    // For now, just console in production too
    console.error(entry);
  }
}

export const logger = new Logger();
```

### 5.2 Replace console.log/error Throughout Codebase
Use find/replace with review:
- `console.log` → `logger.debug` or `logger.info`
- `console.error` → `logger.error`
- `console.warn` → `logger.warn`

**Target**: All 72 occurrences across 39 files

### 5.3 Add Logging to Repositories
```typescript
// In BaseLocalStorageRepository
async get(id: string): Promise<Result<T, NotFoundError>> {
  logger.debug(`Fetching ${this.entityName}`, { id });

  await this.simulateDelay();
  const items = this.getFromStorage();
  const item = items.find(i => i.id === id);

  if (!item) {
    logger.warn(`${this.entityName} not found`, { id });
    return err(new NotFoundError(this.entityName, id));
  }

  logger.debug(`${this.entityName} fetched successfully`, { id });
  return ok(item);
}
```

**Deliverables**: Structured logging throughout, foundation for production monitoring

---

## Success Metrics

### Code Quality
- ✅ Zero `any` types in data layer
- ✅ All async operations use Result<T, E>
- ✅ All repositories implement consistent interface
- ✅ 100% type-safe error handling

### Developer Experience
- ✅ Clear error types with semantic meaning
- ✅ 40+ try-catch blocks reduced to ~8 wrapper calls
- ✅ Consistent async state patterns across stores
- ✅ Easy to add new repositories (extend base class)

### Future-Proofing
- ✅ HTTP migration requires changing only repository implementations
- ✅ Error codes align with HTTP status codes
- ✅ Result pattern works identically with async HTTP calls
- ✅ Logging ready for production monitoring service

### Lines of Code
- Error system: +300 lines (new infrastructure)
- Result utilities: +100 lines (enhanced)
- Base repository: +200 lines
- Async wrappers: +150 lines
- Net reduction after applying to stores: -600 lines
- **Total**: -150 lines + massive quality improvement

---

## Migration Path for Remaining Entities

After POC with Solutions, repeat for each entity:

1. Create repository implementation (extend BaseLocalStorageRepository)
2. Add to repository provider
3. Create focused store using createAsyncAction
4. Update imports in components
5. Test thoroughly

**Estimated time per entity**: 2-4 hours (vs 2-3 days per entity currently)

---

## Risk Mitigation

1. **Start with one entity (Solutions)** - validate approach before scaling
2. **Keep old code alongside new** during migration - easy rollback
3. **Comprehensive tests** for base repository - ensures all entities work
4. **Type system enforces correctness** - won't compile if pattern violated
5. **Result pattern is battle-tested** - used in Rust, Railway-oriented programming

---

## Future HTTP Migration (Post-Refactoring)

When the backend API is ready, the migration path is simple:

1. **Create HTTP Repository Base Class** (~200 lines)
   ```typescript
   // app/core/data/repositories/http/BaseHttpRepository.ts
   export abstract class BaseHttpRepository<T, CreateDTO, UpdateDTO>
     implements IEntityRepository<T, CreateDTO, UpdateDTO> {

     constructor(
       protected httpClient: HttpClient,
       protected endpoint: string
     ) {}

     async list(parentId: string): Promise<T[]> {
       const response = await this.httpClient.get(`${this.endpoint}?parentId=${parentId}`);
       return response.data;
     }

     async get(id: string): Promise<Result<T, RepositoryError>> {
       try {
         const response = await this.httpClient.get(`${this.endpoint}/${id}`);
         return ok(response.data);
       } catch (error) {
         if (error.status === 404) {
           return err(new NotFoundError(this.entityName, id));
         }
         // Map other HTTP errors to RepositoryError types
       }
     }

     // ... other methods
   }
   ```

2. **Implement HTTP Repository for Each Entity** (~50 lines each)
   ```typescript
   export class HttpSolutionRepository extends BaseHttpRepository<
     Solution,
     CreateSolutionDto,
     UpdateSolutionDto
   > {
     constructor(httpClient: HttpClient) {
       super(httpClient, '/api/solutions');
     }

     protected entityName = 'Solution';
   }
   ```

3. **Update Repository Provider** (1 line change per entity)
   ```typescript
   const USE_HTTP = import.meta.env.VITE_USE_HTTP_API === 'true';

   export const repositories = {
     solution: USE_HTTP
       ? new HttpSolutionRepository(httpClient)
       : new SolutionRepository(),
   };
   ```

4. **Gradual Per-Entity Migration**
   ```typescript
   export const repositories = {
     solution: config.features.solutionUseHttp ? httpRepo : localStorageRepo,
     feature: config.features.featureUseHttp ? httpRepo : localStorageRepo,
     // Migrate one at a time, monitor, then move to next
   };
   ```

5. **Zero Store Changes Needed!** ✨
   - Stores use `IEntityRepository` interface
   - Don't care about implementation details
   - Same Result<T, E> return types
   - Same error handling patterns

**Total migration effort**: ~500 lines of new HTTP code vs ~2,000+ lines if refactoring stores directly
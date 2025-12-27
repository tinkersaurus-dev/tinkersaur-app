import type { DiagramStoreBase } from '../types';

/**
 * Consolidated error handling for diagram store operations.
 * Replaces the repeated pattern found throughout the store.
 *
 * @param error - The caught error
 * @param set - Zustand set function (accepts partial state updater)
 * @param contextId - The ID to use as the error key (e.g., diagramId)
 * @param defaultMessage - Default error message if error is not an Error instance
 * @throws Always rethrows the original error after updating state
 */
export function handleStoreError(
  error: unknown,
  set: (partial: (state: DiagramStoreBase) => Partial<DiagramStoreBase>) => void,
  contextId: string,
  defaultMessage: string
): never {
  const err = error instanceof Error ? error : new Error(defaultMessage);
  set((state) => ({
    errors: { ...state.errors, [contextId]: err },
  }));
  throw error;
}

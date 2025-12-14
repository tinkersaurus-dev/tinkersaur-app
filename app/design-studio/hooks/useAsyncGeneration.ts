/**
 * Generic hook for async generation operations with loading and error state.
 *
 * Follows the pattern established by useSuggestionsGenerator but generalized
 * for any async operation that produces typed data.
 */

import { useState, useCallback } from 'react';

/**
 * Return type for the useAsyncGeneration hook
 */
export interface UseAsyncGenerationReturn<T> {
  /** The generated data (empty array until generated) */
  data: T[];
  /** Whether generation is in progress */
  isLoading: boolean;
  /** Error message if generation failed, null otherwise */
  error: string | null;
  /** Function to trigger generation */
  generate: () => Promise<void>;
  /** Function to update data externally (for edit operations) */
  setData: (data: T[]) => void;
}

/**
 * Options for configuring the useAsyncGeneration hook
 */
export interface UseAsyncGenerationOptions<T> {
  /** The async function that generates data */
  generatorFn: () => Promise<T[]>;
}

/**
 * Hook for managing async generation operations
 *
 * @example
 * ```tsx
 * const userStories = useAsyncGeneration<UserStory>({
 *   generatorFn: useCallback(() => generateUserStories(content), [content]),
 * });
 *
 * // In JSX:
 * <Button onClick={userStories.generate} loading={userStories.isLoading}>
 *   Generate
 * </Button>
 * {userStories.error && <div>{userStories.error}</div>}
 * <UserStoriesPanel initialStories={userStories.data} />
 * ```
 */
export function useAsyncGeneration<T>({
  generatorFn,
}: UseAsyncGenerationOptions<T>): UseAsyncGenerationReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generatorFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsLoading(false);
    }
  }, [generatorFn]);

  return {
    data,
    isLoading,
    error,
    generate,
    setData,
  };
}

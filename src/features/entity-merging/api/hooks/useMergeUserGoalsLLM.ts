/**
 * Hook for merging user goals using the LLM API
 */

import { useCallback, useState } from 'react';
import {
  mergeUserGoals,
  MergeUserGoalsAPIError,
  type UserGoalInput,
  type MergedUserGoalData,
  type UserGoal,
} from '@/entities/user-goal';

export function useMergeUserGoalsLLM() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MergedUserGoalData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const merge = useCallback(
    async (userGoals: UserGoal[] | UserGoalInput[], teamId: string, instructions?: string) => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        const merged = await mergeUserGoals(userGoals, teamId, instructions);
        setResult(merged);
      } catch (err) {
        let errorMessage = 'Network error occurred';
        if (err instanceof MergeUserGoalsAPIError) {
          errorMessage = err.message;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    merge,
    reset,
    isLoading,
    result,
    error,
  };
}

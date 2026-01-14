import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '~/core/query/queryKeys';
import { solutionApi } from '~/core/entities/product-management/api';
import type { CreateSolutionDto } from '~/core/entities/product-management/types';
import { useSolutionStore } from '~/core/solution';

/**
 * Mutation hook for creating a solution
 */
export function useCreateSolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSolutionDto) => solutionApi.create(data),
    onSuccess: (newSolution, variables) => {
      // Only invalidate the list for this specific team
      queryClient.invalidateQueries({ queryKey: queryKeys.solutions.list(variables.teamId) });
      // Set the new solution in cache directly
      if (newSolution) {
        queryClient.setQueryData(queryKeys.solutions.detail(newSolution.id), newSolution);
      }
      toast.success('Solution created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create solution');
    },
  });
}

/**
 * Mutation hook for updating a solution
 */
export function useUpdateSolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateSolutionDto> }) =>
      solutionApi.update(id, updates),
    onSuccess: (updatedSolution, variables) => {
      // Update the cache directly with the new data
      if (updatedSolution) {
        queryClient.setQueryData(queryKeys.solutions.detail(variables.id), updatedSolution);
        // Invalidate only the team's list
        queryClient.invalidateQueries({ queryKey: queryKeys.solutions.list(updatedSolution.teamId) });
      }
      toast.success('Solution updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update solution');
    },
  });
}

/**
 * Mutation hook for deleting a solution
 * Also invalidates related use cases and requirements
 */
export function useDeleteSolution() {
  const queryClient = useQueryClient();
  const { selectedSolution, clearSolution } = useSolutionStore.getState();

  return useMutation({
    mutationFn: (id: string) => solutionApi.delete(id),
    onSuccess: async (_, id) => {
      // Clear solution selection if the deleted solution was selected
      if (selectedSolution?.solutionId === id) {
        clearSolution();
      }
      // Cancel any in-flight queries for the deleted solution to prevent 404 errors
      await queryClient.cancelQueries({ queryKey: queryKeys.solutions.detail(id) });
      // Remove the specific solution from cache
      queryClient.removeQueries({ queryKey: queryKeys.solutions.detail(id) });
      // Invalidate solutions lists (but not the detail query we just removed)
      queryClient.invalidateQueries({
        queryKey: queryKeys.solutions.all,
        predicate: (query) => !query.queryKey.includes('detail'),
      });
      // Invalidate related use cases (cascade effect)
      queryClient.invalidateQueries({ queryKey: queryKeys.useCases.all });
      toast.success('Solution deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete solution');
    },
  });
}

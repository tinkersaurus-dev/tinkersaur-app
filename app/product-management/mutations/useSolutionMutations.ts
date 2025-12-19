import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '~/core/query/queryKeys';
import { solutionApi } from '~/core/entities/product-management/api';
import type { CreateSolutionDto } from '~/core/entities/product-management/types';

/**
 * Mutation hook for creating a solution
 */
export function useCreateSolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSolutionDto) => solutionApi.create(data),
    onSuccess: () => {
      // Invalidate the solutions list for this team
      queryClient.invalidateQueries({ queryKey: queryKeys.solutions.all });
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
      // Invalidate both the list and the specific solution
      queryClient.invalidateQueries({ queryKey: queryKeys.solutions.all });
      if (updatedSolution) {
        queryClient.setQueryData(queryKeys.solutions.detail(variables.id), updatedSolution);
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

  return useMutation({
    mutationFn: (id: string) => solutionApi.delete(id),
    onSuccess: async (success, id) => {
      if (success) {
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
      } else {
        toast.error('Failed to delete solution');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete solution');
    },
  });
}

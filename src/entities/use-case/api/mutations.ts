import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query';
import { useCaseApi } from './useCaseApi';
import type { CreateUseCaseDto } from '../model/types';

/**
 * Mutation hook for creating a use case
 */
export function useCreateUseCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUseCaseDto) => useCaseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.useCases.all });
      toast.success('Use case created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create use case');
    },
  });
}

/**
 * Mutation hook for updating a use case
 */
export function useUpdateUseCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateUseCaseDto> }) =>
      useCaseApi.update(id, updates),
    onSuccess: (updatedUseCase, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.useCases.all });
      if (updatedUseCase) {
        queryClient.setQueryData(queryKeys.useCases.detail(variables.id), updatedUseCase);
      }
      toast.success('Use case updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update use case');
    },
  });
}

/**
 * Mutation hook for deleting a use case
 * Also invalidates related requirements
 */
export function useDeleteUseCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => useCaseApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.useCases.all });
      queryClient.removeQueries({ queryKey: queryKeys.useCases.detail(id) });
      // Invalidate related requirements (cascade effect)
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.all });
      // Invalidate personas since they have useCaseIds
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.all });
      toast.success('Use case deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete use case');
    },
  });
}

/**
 * Mutation hook for assigning or unassigning a use case to a solution
 */
export function useAssignUseCaseToSolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, solutionId }: { id: string; solutionId: string | null }) =>
      useCaseApi.update(id, { solutionId: solutionId ?? undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.useCases.all });
      toast.success('Use case assignment updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update use case assignment');
    },
  });
}

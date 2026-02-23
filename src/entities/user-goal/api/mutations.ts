import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query';
import { userGoalApi } from './userGoalApi';
import type { CreateUserGoalDto, PromoteUserGoalRequest } from '../model/types';

/**
 * Mutation hook for creating a user goal
 */
export function useCreateUserGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserGoalDto) => userGoalApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userGoals.all });
      toast.success('User goal created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create user goal');
    },
  });
}

/**
 * Mutation hook for updating a user goal
 */
export function useUpdateUserGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateUserGoalDto> }) =>
      userGoalApi.update(id, updates),
    onSuccess: (updatedUserGoal, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userGoals.all });
      if (updatedUserGoal) {
        queryClient.setQueryData(queryKeys.userGoals.detail(variables.id), updatedUserGoal);
      }
      toast.success('User goal updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user goal');
    },
  });
}

/**
 * Mutation hook for deleting a user goal
 */
export function useDeleteUserGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userGoalApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userGoals.all });
      queryClient.removeQueries({ queryKey: queryKeys.userGoals.detail(id) });
      // Invalidate personas since they may have userGoalIds
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.all });
      toast.success('User goal deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete user goal');
    },
  });
}

/**
 * Mutation hook for promoting a user goal to a use case in a solution
 */
export function usePromoteUserGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PromoteUserGoalRequest) => userGoalApi.promote(request),
    onSuccess: () => {
      // Invalidate both user goals and use cases since promotion affects both
      queryClient.invalidateQueries({ queryKey: queryKeys.userGoals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.useCases.all });
      toast.success('User goal promoted to use case');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to promote user goal');
    },
  });
}

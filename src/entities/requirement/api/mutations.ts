import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query';
import { requirementApi } from './requirementApi';
import type { CreateRequirementDto } from '../model/types';

/**
 * Mutation hook for creating a requirement
 */
export function useCreateRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRequirementDto) => requirementApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.all });
      toast.success('Requirement created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create requirement');
    },
  });
}

/**
 * Mutation hook for updating a requirement
 */
export function useUpdateRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateRequirementDto> }) =>
      requirementApi.update(id, updates),
    onSuccess: (updatedRequirement, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.all });
      if (updatedRequirement) {
        queryClient.setQueryData(queryKeys.requirements.detail(variables.id), updatedRequirement);
      }
      toast.success('Requirement updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update requirement');
    },
  });
}

/**
 * Mutation hook for deleting a requirement
 */
export function useDeleteRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => requirementApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.all });
      queryClient.removeQueries({ queryKey: queryKeys.requirements.detail(id) });
      toast.success('Requirement deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete requirement');
    },
  });
}

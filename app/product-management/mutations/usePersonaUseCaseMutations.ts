import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '~/core/query/queryKeys';
import { personaUseCaseApi } from '~/core/entities/product-management/api';
import type { CreatePersonaUseCaseDto } from '~/core/entities/product-management/types';

/**
 * Mutation hook for creating a persona-use case association
 */
export function useCreatePersonaUseCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePersonaUseCaseDto) => personaUseCaseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personaUseCases.all });
      toast.success('Persona linked to use case successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to link persona to use case');
    },
  });
}

/**
 * Mutation hook for deleting a persona-use case association
 */
export function useDeletePersonaUseCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => personaUseCaseApi.delete(id),
    onSuccess: (success) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.personaUseCases.all });
        toast.success('Persona unlinked from use case successfully');
      } else {
        toast.error('Failed to unlink persona from use case');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unlink persona from use case');
    },
  });
}

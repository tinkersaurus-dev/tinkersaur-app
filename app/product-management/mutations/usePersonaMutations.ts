import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '~/core/query/queryKeys';
import { personaApi } from '~/core/entities/product-management/api';
import type { CreatePersonaDto, MergePersonasRequest } from '~/core/entities/product-management/types';

/**
 * Mutation hook for creating a persona
 */
export function useCreatePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePersonaDto) => personaApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.all });
      toast.success('Persona created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create persona');
    },
  });
}

/**
 * Mutation hook for updating a persona
 */
export function useUpdatePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreatePersonaDto> }) =>
      personaApi.update(id, updates),
    onSuccess: (updatedPersona, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.all });
      if (updatedPersona) {
        queryClient.setQueryData(queryKeys.personas.detail(variables.id), updatedPersona);
      }
      toast.success('Persona updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update persona');
    },
  });
}

/**
 * Mutation hook for deleting a persona
 */
export function useDeletePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => personaApi.delete(id),
    onSuccess: (success, id) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.personas.all });
        queryClient.removeQueries({ queryKey: queryKeys.personas.detail(id) });
        // Invalidate persona-use case associations
        queryClient.invalidateQueries({ queryKey: queryKeys.personaUseCases.all });
        toast.success('Persona deleted successfully');
      } else {
        toast.error('Failed to delete persona');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete persona');
    },
  });
}

/**
 * Mutation hook for merging personas
 */
export function useMergePersonas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: MergePersonasRequest) => personaApi.merge(request),
    onSuccess: () => {
      // Invalidate all persona queries since source personas are now merged
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.all });
      // Invalidate persona-use case associations
      queryClient.invalidateQueries({ queryKey: queryKeys.personaUseCases.all });
      // Invalidate feedback-persona associations
      queryClient.invalidateQueries({ queryKey: queryKeys.feedbackPersonas.all });
      toast.success('Personas merged successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to merge personas');
    },
  });
}

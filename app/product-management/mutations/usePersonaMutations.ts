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
    onSuccess: (newPersona, variables) => {
      // Only invalidate the list for this specific team
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.list(variables.teamId) });
      // Invalidate paginated queries for this team
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.all,
        predicate: (query) =>
          query.queryKey.includes('paginated') &&
          JSON.stringify(query.queryKey).includes(variables.teamId),
      });
      // Set the new persona in cache directly
      if (newPersona) {
        queryClient.setQueryData(queryKeys.personas.detail(newPersona.id), newPersona);
      }
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
      // Update the cache directly with the new data
      if (updatedPersona) {
        queryClient.setQueryData(queryKeys.personas.detail(variables.id), updatedPersona);
        // Invalidate only the team's list and paginated queries
        queryClient.invalidateQueries({ queryKey: queryKeys.personas.list(updatedPersona.teamId) });
        queryClient.invalidateQueries({
          queryKey: queryKeys.personas.all,
          predicate: (query) =>
            query.queryKey.includes('paginated') &&
            JSON.stringify(query.queryKey).includes(updatedPersona.teamId),
        });
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
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.all });
      queryClient.removeQueries({ queryKey: queryKeys.personas.detail(id) });
      // Invalidate persona-use case associations
      queryClient.invalidateQueries({ queryKey: queryKeys.personaUseCases.all });
      toast.success('Persona deleted successfully');
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

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query';
import { teamApi } from '@/entities/team';
import type { CreateTeamDto } from '@/entities/team';

/**
 * Mutation hook for creating a team
 */
export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTeamDto) => teamApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
      toast.success('Team created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create team');
    },
  });
}

/**
 * Mutation hook for updating a team
 */
export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateTeamDto> }) =>
      teamApi.update(id, updates),
    onSuccess: (updatedTeam, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
      if (updatedTeam) {
        queryClient.setQueryData(queryKeys.teams.detail(variables.id), updatedTeam);
      }
      toast.success('Team updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update team');
    },
  });
}

/**
 * Mutation hook for deleting a team
 */
export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => teamApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
      queryClient.removeQueries({ queryKey: queryKeys.teams.detail(id) });
      // Invalidate related data (cascade effect)
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.solutions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.all });
      toast.success('Team deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete team');
    },
  });
}

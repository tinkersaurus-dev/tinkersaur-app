import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '~/core/query/queryKeys';
import { organizationApi } from '~/core/entities/product-management/api';
import type { CreateOrganizationDto } from '~/core/entities/product-management/types';

/**
 * Mutation hook for creating an organization
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrganizationDto) => organizationApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
      toast.success('Organization created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create organization');
    },
  });
}

/**
 * Mutation hook for updating an organization
 */
export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateOrganizationDto> }) =>
      organizationApi.update(id, updates),
    onSuccess: (updatedOrganization, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
      if (updatedOrganization) {
        queryClient.setQueryData(queryKeys.organizations.detail(variables.id), updatedOrganization);
      }
      toast.success('Organization updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update organization');
    },
  });
}

/**
 * Mutation hook for deleting an organization
 */
export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => organizationApi.delete(id),
    onSuccess: (success, id) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
        queryClient.removeQueries({ queryKey: queryKeys.organizations.detail(id) });
        // Invalidate related teams (cascade effect)
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
        toast.success('Organization deleted successfully');
      } else {
        toast.error('Failed to delete organization');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete organization');
    },
  });
}

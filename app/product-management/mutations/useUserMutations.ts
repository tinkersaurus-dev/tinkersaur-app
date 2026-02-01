import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query';
import { userApi } from '@/entities/user';
import type { CreateUserDto } from '@/entities/user';

/**
 * Mutation hook for creating a user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserDto) => userApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success('User created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create user');
    },
  });
}

/**
 * Mutation hook for updating a user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateUserDto> }) =>
      userApi.update(id, updates),
    onSuccess: (updatedUser, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      if (updatedUser) {
        queryClient.setQueryData(queryKeys.users.detail(variables.id), updatedUser);
      }
      toast.success('User updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user');
    },
  });
}

/**
 * Mutation hook for deleting a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.removeQueries({ queryKey: queryKeys.users.detail(id) });
      toast.success('User deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });
}

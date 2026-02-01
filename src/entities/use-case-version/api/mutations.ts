import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query';
import { useCaseVersionApi } from './useCaseVersionApi';
import type {
  CreateUseCaseVersionDto,
  UpdateUseCaseVersionDto,
} from '../model/types';

/**
 * Mutation hook for creating a use case version
 */
export function useCreateUseCaseVersion() {
  return useMutation({
    mutationFn: ({ useCaseId, data }: { useCaseId: string; data: CreateUseCaseVersionDto }) =>
      useCaseVersionApi.create(useCaseId, data),
    onSuccess: () => {
      toast.success('Version created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create version');
    },
  });
}

/**
 * Mutation hook for updating a use case version
 */
export function useUpdateUseCaseVersion() {
  return useMutation({
    mutationFn: ({
      useCaseId,
      versionId,
      data,
    }: {
      useCaseId: string;
      versionId: string;
      data: UpdateUseCaseVersionDto;
    }) => useCaseVersionApi.update(useCaseId, versionId, data),
    onSuccess: () => {
      toast.success('Version updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update version');
    },
  });
}

/**
 * Mutation hook for deleting a use case version
 */
export function useDeleteUseCaseVersion() {
  return useMutation({
    mutationFn: ({ useCaseId, versionId }: { useCaseId: string; versionId: string }) =>
      useCaseVersionApi.delete(useCaseId, versionId),
    onSuccess: () => {
      toast.success('Version deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete version');
    },
  });
}

/**
 * Mutation hook for transitioning a use case version status
 */
export function useTransitionUseCaseVersionStatus() {
  return useMutation({
    mutationFn: ({
      useCaseId,
      versionId,
      targetStatus,
    }: {
      useCaseId: string;
      versionId: string;
      targetStatus: string;
    }) => useCaseVersionApi.transitionStatus(useCaseId, versionId, targetStatus),
    onSuccess: () => {
      toast.success('Version status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update version status');
    },
  });
}

/**
 * Mutation hook for reverting a use case to a specific version
 * This invalidates all related queries since the revert affects:
 * - UseCase (name, description, quotes)
 * - Requirements
 * - DesignWorks (and their diagrams, documents, interfaces, references)
 */
export function useRevertToUseCaseVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ useCaseId, versionId }: { useCaseId: string; versionId: string }) =>
      useCaseVersionApi.revert(useCaseId, versionId),
    onSuccess: (_, variables) => {
      // Invalidate the use case detail
      queryClient.invalidateQueries({ queryKey: queryKeys.useCases.detail(variables.useCaseId) });
      // Invalidate all use cases (list views)
      queryClient.invalidateQueries({ queryKey: queryKeys.useCases.all });
      // Invalidate requirements for this use case
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.list(variables.useCaseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.all });
      // Invalidate design works (the revert recreates them)
      queryClient.invalidateQueries({ queryKey: queryKeys.designWorks.all });
      // Invalidate diagrams, documents, interfaces, references
      queryClient.invalidateQueries({ queryKey: queryKeys.diagrams.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.interfaces.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.references.all });
      toast.success('Reverted to version successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to revert to version');
    },
  });
}

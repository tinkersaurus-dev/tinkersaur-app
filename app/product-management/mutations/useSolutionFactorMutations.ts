import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '~/core/query/queryKeys';
import { solutionFactorApi } from '~/core/entities/product-management/api';
import type {
  CreateSolutionFactorDto,
  UpdateSolutionFactorDto,
  CreateSolutionFactorsBulkDto,
  SolutionFactorType,
} from '~/core/entities/product-management/types';

/**
 * Mutation hook for creating a single solution factor
 */
export function useCreateSolutionFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateSolutionFactorDto) => solutionFactorApi.create(dto),
    onSuccess: (newFactor) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.solutionFactors.bySolution(newFactor.solutionId),
      });
      toast.success('Factor created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create factor');
    },
  });
}

/**
 * Mutation hook for updating a solution factor
 */
export function useUpdateSolutionFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateSolutionFactorDto }) =>
      solutionFactorApi.update(id, updates),
    onSuccess: (updatedFactor) => {
      if (updatedFactor) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.solutionFactors.bySolution(updatedFactor.solutionId),
        });
      }
      toast.success('Factor updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update factor');
    },
  });
}

/**
 * Mutation hook for deleting a solution factor
 */
export function useDeleteSolutionFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, solutionId }: { id: string; solutionId: string }) =>
      solutionFactorApi.delete(id).then((success) => ({ success, solutionId })),
    onSuccess: ({ success, solutionId }) => {
      if (success) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.solutionFactors.bySolution(solutionId),
        });
        toast.success('Factor deleted successfully');
      } else {
        toast.error('Failed to delete factor');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete factor');
    },
  });
}

/**
 * Mutation hook for bulk creating factors (from LLM generation)
 */
export function useCreateSolutionFactorsBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateSolutionFactorsBulkDto) => solutionFactorApi.createBulk(dto),
    onSuccess: (newFactors) => {
      if (newFactors.length > 0) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.solutionFactors.bySolution(newFactors[0].solutionId),
        });
      }
      toast.success(`Created ${newFactors.length} factors successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create factors');
    },
  });
}

/**
 * Mutation hook for reordering factors within a type
 */
export function useReorderSolutionFactors() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      solutionId,
      type,
      factorIds,
    }: {
      solutionId: string;
      type: SolutionFactorType;
      factorIds: string[];
    }) => solutionFactorApi.reorder(solutionId, type, factorIds).then((success) => ({ success, solutionId })),
    onSuccess: ({ success, solutionId }) => {
      if (success) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.solutionFactors.bySolution(solutionId),
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reorder factors');
    },
  });
}

/**
 * Mutation hook for deleting all factors of a type (for regeneration)
 */
export function useDeleteSolutionFactorsByType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      solutionId,
      type,
    }: {
      solutionId: string;
      type: SolutionFactorType;
    }) => solutionFactorApi.deleteByType(solutionId, type).then((success) => ({ success, solutionId })),
    onSuccess: ({ success, solutionId }) => {
      if (success) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.solutionFactors.bySolution(solutionId),
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete factors');
    },
  });
}

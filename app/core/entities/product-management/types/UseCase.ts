import { z } from 'zod';

/**
 * UseCase domain model
 * Represents a use case within a team, optionally associated with a solution
 */

// Zod schema for runtime validation
export const UseCaseSchema = z.object({
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  solutionId: z.string().uuid().nullable(),
  name: z.string().min(1, 'Use case name is required').max(200),
  description: z.string().max(2000),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript type derived from schema
export type UseCase = z.infer<typeof UseCaseSchema>;

// Schema for creating a new use case (without generated fields)
export const CreateUseCaseSchema = z.object({
  teamId: z.string().uuid(),
  solutionId: z.string().uuid().optional(),
  name: z.string().min(1, 'Use case name is required').max(200),
  description: z.string().max(2000).optional().default(''),
});

export type CreateUseCaseDto = z.infer<typeof CreateUseCaseSchema>;

// Schema for updating a use case (all fields optional except id)
export const UpdateUseCaseSchema = z.object({
  id: z.string().uuid(),
  solutionId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
});

export type UpdateUseCaseDto = z.infer<typeof UpdateUseCaseSchema>;

// Similarity matching types
export interface FindSimilarUseCasesRequest {
  teamId: string;
  name: string;
  description?: string;
  threshold?: number;
  limit?: number;
}

export interface SimilarUseCaseResult {
  useCase: UseCase;
  similarity: number;
  matchType: 'name' | 'name+description';
}

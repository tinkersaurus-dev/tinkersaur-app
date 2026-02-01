import { z } from 'zod';
import { QuoteWithSourceSchema } from '@/entities/quote';

/**
 * UseCase domain model
 * Represents a use case within a team, optionally associated with a solution
 */

// Zod schema for runtime validation
export const UseCaseSchema = z.object({
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  solutionId: z.string().uuid().nullable(),
  intakeSourceId: z.string().uuid().nullable(),
  mergedIntoId: z.string().uuid().nullable().optional(),
  name: z.string().min(1, 'Use case name is required').max(200),
  description: z.string().max(2000),
  quotes: z.array(QuoteWithSourceSchema),
  personaIds: z.array(z.string().uuid()).default([]),
  feedbackIds: z.array(z.string().uuid()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript type derived from schema
export type UseCase = z.infer<typeof UseCaseSchema>;

// Schema for creating a new use case (without generated fields)
export const CreateUseCaseSchema = z.object({
  teamId: z.string().uuid(),
  solutionId: z.string().uuid().optional(),
  intakeSourceId: z.string().uuid().optional(),
  name: z.string().min(1, 'Use case name is required').max(200),
  description: z.string().max(2000).optional().default(''),
  quotes: z.array(z.string()).optional(),
  personaIds: z.array(z.string().uuid()).optional(),
});

export type CreateUseCaseDto = z.infer<typeof CreateUseCaseSchema>;

// Schema for updating a use case (all fields optional except id)
export const UpdateUseCaseSchema = z.object({
  id: z.string().uuid(),
  solutionId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  quotes: z.array(z.string()).optional(),
  personaIds: z.array(z.string().uuid()).optional(),
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

// Schema for merged use case data (output from LLM)
export const MergedUseCaseDataSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export type MergedUseCaseData = z.infer<typeof MergedUseCaseDataSchema>;

// Schema for merge use cases request (to backend API)
export const MergeUseCasesRequestSchema = z.object({
  teamId: z.string().uuid(),
  targetUseCaseId: z.string().uuid(),
  sourceUseCaseIds: z.array(z.string().uuid()).min(1),
  mergedUseCase: MergedUseCaseDataSchema.optional(),
  additionalIntakeSourceIds: z.array(z.string().uuid()).optional(),
});

export type MergeUseCasesRequest = z.infer<typeof MergeUseCasesRequestSchema>;

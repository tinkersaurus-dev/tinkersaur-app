import { z } from 'zod';

/**
 * UseCase domain model
 * Represents a use case within a solution
 */

// Zod schema for runtime validation
export const UseCaseSchema = z.object({
  id: z.string().uuid(),
  solutionId: z.string().uuid(),
  name: z.string().min(1, 'Use case name is required').max(200),
  description: z.string().max(2000),
  implementedChangeId: z.string().uuid().optional(), // Current "production" state
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript type derived from schema
export type UseCase = z.infer<typeof UseCaseSchema>;

// Schema for creating a new use case (without generated fields)
export const CreateUseCaseSchema = UseCaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateUseCaseDto = z.infer<typeof CreateUseCaseSchema>;

// Schema for updating a use case (all fields optional except id)
export const UpdateUseCaseSchema = UseCaseSchema.partial().required({ id: true });

export type UpdateUseCaseDto = z.infer<typeof UpdateUseCaseSchema>;

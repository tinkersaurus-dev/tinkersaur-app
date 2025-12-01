import { z } from 'zod';

/**
 * Solution domain model
 * Represents a solution in the system
 */

// Solution types enum
export const SolutionTypeSchema = z.enum([
  'product',
  'service',
  'process',
  'pipeline',
  'infrastructure',
]);

export type SolutionType = z.infer<typeof SolutionTypeSchema>;

// Zod schema for runtime validation
export const SolutionSchema = z.object({
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  name: z.string().min(1, 'Solution name is required').max(200),
  description: z.string().max(2000),
  type: SolutionTypeSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript type derived from schema
export type Solution = z.infer<typeof SolutionSchema>;

// Schema for creating a new solution (without generated fields)
export const CreateSolutionSchema = SolutionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateSolutionDto = z.infer<typeof CreateSolutionSchema>;

// Schema for updating a solution (all fields optional except id)
export const UpdateSolutionSchema = SolutionSchema.partial().required({ id: true });

export type UpdateSolutionDto = z.infer<typeof UpdateSolutionSchema>;

import { z } from 'zod';

/**
 * Feature domain model
 * Represents a feature within a solution
 */

// Zod schema for runtime validation
export const FeatureSchema = z.object({
  id: z.string().uuid(),
  solutionId: z.string().uuid(),
  name: z.string().min(1, 'Feature name is required').max(200),
  description: z.string().max(2000),
  implementedChangeId: z.string().uuid().optional(), // Current "production" state
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript type derived from schema
export type Feature = z.infer<typeof FeatureSchema>;

// Schema for creating a new feature (without generated fields)
export const CreateFeatureSchema = FeatureSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateFeatureDto = z.infer<typeof CreateFeatureSchema>;

// Schema for updating a feature (all fields optional except id)
export const UpdateFeatureSchema = FeatureSchema.partial().required({ id: true });

export type UpdateFeatureDto = z.infer<typeof UpdateFeatureSchema>;

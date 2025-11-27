import { z } from 'zod';

/**
 * Requirement domain model
 * Represents a requirement within a use case
 */

// Requirement type enum
export const RequirementTypeSchema = z.enum(['functional', 'non-functional', 'constraint']);
export type RequirementType = z.infer<typeof RequirementTypeSchema>;

// Zod schema for runtime validation
export const RequirementSchema = z.object({
  id: z.string().uuid(),
  useCaseId: z.string().uuid(),
  text: z.string().min(1, 'Requirement text is required').max(5000),
  type: RequirementTypeSchema,
  priority: z.number().int().min(0).max(100),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript type derived from schema
export type Requirement = z.infer<typeof RequirementSchema>;

// Schema for creating a new requirement (without generated fields)
export const CreateRequirementSchema = RequirementSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateRequirementDto = z.infer<typeof CreateRequirementSchema>;

// Schema for updating a requirement (all fields optional except id)
export const UpdateRequirementSchema = RequirementSchema.partial().required({ id: true });

export type UpdateRequirementDto = z.infer<typeof UpdateRequirementSchema>;

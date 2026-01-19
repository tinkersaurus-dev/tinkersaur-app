import { z } from 'zod';

/**
 * Requirement domain model
 * Represents a requirement within a use case
 */

// Requirement type enum
export const RequirementTypeSchema = z.enum(['functional', 'non-functional', 'constraint']);
export type RequirementType = z.infer<typeof RequirementTypeSchema>;

// Shared config for requirement type colors (used by UI components)
export const REQUIREMENT_TYPE_CONFIG: Record<RequirementType, { label: string; color: 'blue' | 'orange' | 'default' }> = {
  functional: { label: 'Functional', color: 'blue' },
  'non-functional': { label: 'Non-Functional', color: 'orange' },
  constraint: { label: 'Constraint', color: 'default' },
};

// Requirement status enum
export const RequirementStatusSchema = z.enum(['Todo', 'InProgress', 'Done']);
export type RequirementStatus = z.infer<typeof RequirementStatusSchema>;

// Shared config for requirement status colors
export const REQUIREMENT_STATUS_CONFIG: Record<RequirementStatus, { label: string; color: 'default' | 'blue' | 'green' }> = {
  Todo: { label: 'To Do', color: 'default' },
  InProgress: { label: 'In Progress', color: 'blue' },
  Done: { label: 'Done', color: 'green' },
};

// Zod schema for runtime validation
export const RequirementSchema = z.object({
  id: z.string().uuid(),
  useCaseId: z.string().uuid(),
  text: z.string().min(1, 'Requirement text is required').max(5000),
  type: RequirementTypeSchema,
  status: RequirementStatusSchema,
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

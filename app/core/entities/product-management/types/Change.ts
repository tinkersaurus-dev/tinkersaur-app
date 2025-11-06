import { z } from 'zod';

/**
 * Change domain model
 * Represents a versioned change to a feature
 */

// Change status enum
export const ChangeStatusSchema = z.enum(['draft', 'locked', 'in-design', 'implemented']);
export type ChangeStatus = z.infer<typeof ChangeStatusSchema>;

// Zod schema for runtime validation
export const ChangeSchema = z.object({
  id: z.string().uuid(),
  featureId: z.string().uuid(),
  name: z.string().min(1, 'Change name is required').max(200),
  description: z.string().max(2000),
  status: ChangeStatusSchema,
  version: z.string().min(1, 'Version is required').max(50),
  parentChangeId: z.string().uuid().optional(), // For version lineage
  lockedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript type derived from schema
export type Change = z.infer<typeof ChangeSchema>;

// Schema for creating a new change (without generated fields)
export const CreateChangeSchema = ChangeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateChangeDto = z.infer<typeof CreateChangeSchema>;

// Schema for updating a change (all fields optional except id)
export const UpdateChangeSchema = ChangeSchema.partial().required({ id: true });

export type UpdateChangeDto = z.infer<typeof UpdateChangeSchema>;

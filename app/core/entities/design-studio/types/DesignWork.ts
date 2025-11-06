import { z } from 'zod';

/**
 * Design Work domain model
 * Represents a folder in the design studio tree.
 * Design works are the primary organizational unit for design content.
 * They are associated with a solution and can optionally be linked to specific features or changes.
 * Design works can be nested to create a folder hierarchy.
 */

// Zod schema for runtime validation
export const DesignWorkSchema = z.object({
  id: z.string().uuid(),
  solutionId: z.string().uuid(),
  featureId: z.string().uuid().optional(),
  changeId: z.string().uuid().optional(),
  parentDesignWorkId: z.string().uuid().optional(),
  name: z.string().min(1, 'Design work name is required').max(200),
  version: z.string().min(1, 'Version is required'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript type derived from schema
export type DesignWork = z.infer<typeof DesignWorkSchema>;

// Schema for creating (without generated fields)
export const CreateDesignWorkSchema = DesignWorkSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateDesignWorkDto = z.infer<typeof CreateDesignWorkSchema>;

// Schema for updating (all fields optional except id)
export const UpdateDesignWorkSchema = DesignWorkSchema.partial().required({ id: true });

export type UpdateDesignWorkDto = z.infer<typeof UpdateDesignWorkSchema>;

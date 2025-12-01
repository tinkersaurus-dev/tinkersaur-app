import { z } from 'zod';

/**
 * Team domain model
 * Belongs to exactly one organization
 * Contains users, solutions, and personas
 */

// Zod schema for runtime validation
export const TeamSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().min(1, 'Team name is required').max(200),
  description: z.string().max(2000).default(''),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript type derived from schema
export type Team = z.infer<typeof TeamSchema>;

// Schema for creating a new team (without generated fields)
export const CreateTeamSchema = TeamSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateTeamDto = z.infer<typeof CreateTeamSchema>;

// Schema for updating a team (all fields optional except id)
export const UpdateTeamSchema = TeamSchema.partial().required({ id: true });

export type UpdateTeamDto = z.infer<typeof UpdateTeamSchema>;

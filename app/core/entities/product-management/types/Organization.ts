import { z } from 'zod';

/**
 * Organization domain model
 * Top-level container for teams
 */

// Zod schema for runtime validation
export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Organization name is required').max(200),
  description: z.string().max(2000).default(''),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript type derived from schema
export type Organization = z.infer<typeof OrganizationSchema>;

// Schema for creating a new organization (without generated fields)
export const CreateOrganizationSchema = OrganizationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateOrganizationDto = z.infer<typeof CreateOrganizationSchema>;

// Schema for updating an organization (all fields optional except id)
export const UpdateOrganizationSchema = OrganizationSchema.partial().required({ id: true });

export type UpdateOrganizationDto = z.infer<typeof UpdateOrganizationSchema>;

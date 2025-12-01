import { z } from 'zod';

/**
 * User domain model
 * Belongs to exactly one team
 */

// Zod schema for runtime validation
export const UserSchema = z.object({
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  name: z.string().min(1, 'User name is required').max(200),
  email: z.string().email('Invalid email format').max(200),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript type derived from schema
export type User = z.infer<typeof UserSchema>;

// Schema for creating a new user (without generated fields)
export const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;

// Schema for updating a user (all fields optional except id)
export const UpdateUserSchema = UserSchema.partial().required({ id: true });

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

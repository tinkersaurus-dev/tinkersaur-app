import { z } from 'zod';

/**
 * PersonaUseCase junction model
 * Represents the many-to-many relationship between Personas and UseCases
 */

// Zod schema for runtime validation
export const PersonaUseCaseSchema = z.object({
  id: z.string().uuid(),
  personaId: z.string().uuid(),
  useCaseId: z.string().uuid(),
  createdAt: z.date(),
});

// TypeScript type derived from schema
export type PersonaUseCase = z.infer<typeof PersonaUseCaseSchema>;

// Schema for creating a new persona-usecase link (without generated fields)
export const CreatePersonaUseCaseSchema = PersonaUseCaseSchema.omit({
  id: true,
  createdAt: true,
});

export type CreatePersonaUseCaseDto = z.infer<typeof CreatePersonaUseCaseSchema>;

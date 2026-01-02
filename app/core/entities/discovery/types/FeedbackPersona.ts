import { z } from 'zod';

/**
 * FeedbackPersona junction model
 * Represents the many-to-many relationship between Feedbacks and Personas
 */

// Zod schema for runtime validation
export const FeedbackPersonaSchema = z.object({
  id: z.string().uuid(),
  feedbackId: z.string().uuid(),
  personaId: z.string().uuid(),
  createdAt: z.date(),
});

// TypeScript type derived from schema
export type FeedbackPersona = z.infer<typeof FeedbackPersonaSchema>;

// Schema for creating a new feedback-persona link (without generated fields)
export const CreateFeedbackPersonaSchema = FeedbackPersonaSchema.omit({
  id: true,
  createdAt: true,
});

export type CreateFeedbackPersonaDto = z.infer<typeof CreateFeedbackPersonaSchema>;

import { z } from 'zod';

/**
 * Quote Entity
 * Represents a quote that can be linked to multiple entities (Persona, UseCase, Feedback, Outcome).
 * Quotes are deduplicated at the team level - same quote text = same Quote record.
 */

// QuoteWithSource schema (returned from API for display)
export const QuoteWithSourceSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  intakeSourceId: z.string().uuid().nullable(),
  sourceName: z.string().nullable(), // Computed from IntakeSource for display
});

export type QuoteWithSource = z.infer<typeof QuoteWithSourceSchema>;

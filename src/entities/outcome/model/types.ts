import { z } from 'zod';
import { QuoteWithSourceSchema } from '@/entities/quote';

/**
 * Outcome Entity
 * Represents measurable business outcomes with specific targets.
 * Extracted from stakeholder interviews, user interviews, and meeting transcripts.
 */

// Extracted outcome from transcript (no ID - assigned by API when saved)
export const ExtractedOutcomeSchema = z.object({
  description: z.string(), // What outcome is desired
  target: z.string(), // The explicit metric target
  quotes: z.array(z.string()), // Supporting quotes from transcript
  linkedPersonaIndexes: z.array(z.number()).default([]), // Indexes into personas array
  linkedUserGoalIndexes: z.array(z.number()).default([]), // Indexes into userGoals array
});

export type ExtractedOutcome = z.infer<typeof ExtractedOutcomeSchema>;

// Persisted Outcome schema (from API)
export const OutcomeSchema = z.object({
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  solutionId: z.string().uuid().nullable(),
  intakeSourceId: z.string().uuid().nullable(),
  description: z.string().max(2000),
  target: z.string().max(500),
  quotes: z.array(QuoteWithSourceSchema).default([]),
  personaIds: z.array(z.string().uuid()).default([]),
  userGoalIds: z.array(z.string().uuid()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Outcome = z.infer<typeof OutcomeSchema>;

// Schema for creating a new outcome (without generated fields)
// Quotes on create are plain strings - they'll be converted to QuoteWithSource by the backend
export const CreateOutcomeSchema = OutcomeSchema.omit({
  id: true,
  quotes: true,
  personaIds: true,
  userGoalIds: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  quotes: z.array(z.string()).optional(),
  personaIds: z.array(z.string().uuid()).optional(),
  userGoalIds: z.array(z.string().uuid()).optional(),
});

export type CreateOutcomeDto = z.infer<typeof CreateOutcomeSchema>;

// Schema for updating outcome (all fields optional except id)
export const UpdateOutcomeSchema = OutcomeSchema.partial().required({ id: true });

export type UpdateOutcomeDto = z.infer<typeof UpdateOutcomeSchema>;

// Similarity matching types
export interface FindSimilarOutcomesRequest {
  teamId: string;
  description: string;
  target?: string;
  threshold?: number;
  limit?: number;
}

export interface SimilarOutcomeResult {
  outcome: Outcome;
  similarity: number;
  matchType: 'description' | 'description+target';
}

// Merge types
export interface MergeOutcomeRequest {
  teamId: string;
  parentOutcomeId: string;
  childOutcomeIds: string[];
}

export interface MergeOutcomeResponse {
  parent: Outcome;
  mergedCount: number;
}

import { z } from 'zod';

/**
 * Feedback Entity
 * Represents user feedback extracted from intake sources.
 * Feedback can be linked to personas and use cases.
 */

// Feedback type categorization
export const FeedbackTypeSchema = z.enum([
  'suggestion', // Feature request or improvement idea
  'problem', // Issue or pain point
  'concern', // Worry or hesitation
  'praise', // Positive feedback
  'question', // Unanswered question or confusion
]);

export type FeedbackType = z.infer<typeof FeedbackTypeSchema>;

// Labels and colors for feedback types (for UI display)
export const FEEDBACK_TYPE_CONFIG: Record<
  FeedbackType,
  { label: string; color: string }
> = {
  suggestion: { label: 'Suggestion', color: 'blue' },
  problem: { label: 'Problem', color: 'red' },
  concern: { label: 'Concern', color: 'orange' },
  praise: { label: 'Praise', color: 'green' },
  question: { label: 'Question', color: 'purple' },
};

// Extracted feedback from transcript (no ID - assigned by API when saved)
export const ExtractedFeedbackSchema = z.object({
  type: FeedbackTypeSchema,
  content: z.string(), // Clear summary of the feedback
  context: z.string().optional(), // Additional context about when/why mentioned
  quotes: z.array(z.string()), // Exact quotes from transcript
  confidence: z.number().min(0).max(1), // LLM confidence score
  linkedPersonaIndexes: z.array(z.number()), // Indexes into personas array
  linkedUseCaseIndexes: z.array(z.number()), // Indexes into useCases array
});

export type ExtractedFeedback = z.infer<typeof ExtractedFeedbackSchema>;

// Persisted Feedback schema (from API)
export const FeedbackSchema = z.object({
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  solutionId: z.string().uuid().nullable(),
  type: FeedbackTypeSchema,
  content: z.string().max(2000),
  context: z.string().max(2000).nullable(),
  quotes: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Feedback = z.infer<typeof FeedbackSchema>;

// Schema for creating a new feedback (without generated fields)
export const CreateFeedbackSchema = FeedbackSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateFeedbackDto = z.infer<typeof CreateFeedbackSchema>;

// Schema for updating feedback (all fields optional except id)
export const UpdateFeedbackSchema = FeedbackSchema.partial().required({ id: true });

export type UpdateFeedbackDto = z.infer<typeof UpdateFeedbackSchema>;

// Similarity matching types
export interface FindSimilarFeedbackRequest {
  teamId: string;
  content: string;
  threshold?: number;
  limit?: number;
}

export interface SimilarFeedbackResult {
  feedback: Feedback;
  similarity: number;
  matchType: 'content';
}

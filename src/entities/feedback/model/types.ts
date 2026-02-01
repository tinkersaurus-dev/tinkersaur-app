import { z } from 'zod';
import { QuoteWithSourceSchema } from '@/entities/quote';

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
  quotes: z.array(z.string()), // Exact quotes from transcript
  linkedPersonaIndexes: z.array(z.number()), // Indexes into personas array
  linkedUseCaseIndexes: z.array(z.number()), // Indexes into useCases array
});

export type ExtractedFeedback = z.infer<typeof ExtractedFeedbackSchema>;

// Persisted Feedback schema (from API)
export const FeedbackSchema = z.object({
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  solutionId: z.string().uuid().nullable(),
  intakeSourceId: z.string().uuid().nullable(),
  type: FeedbackTypeSchema,
  content: z.string().max(2000),
  quotes: z.array(QuoteWithSourceSchema),
  personaIds: z.array(z.string().uuid()).default([]),
  useCaseIds: z.array(z.string().uuid()).default([]),
  parentFeedbackId: z.string().uuid().nullable(),
  weight: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Feedback = z.infer<typeof FeedbackSchema>;

// Feedback with children for detail view
export const FeedbackWithChildrenSchema = FeedbackSchema.extend({
  children: z.array(FeedbackSchema),
});

export type FeedbackWithChildren = z.infer<typeof FeedbackWithChildrenSchema>;

// Schema for creating a new feedback (without generated/computed fields)
// Quotes on create are plain strings - they'll be converted to QuoteWithSource by the backend
export const CreateFeedbackSchema = FeedbackSchema.omit({
  id: true,
  quotes: true,
  personaIds: true,
  useCaseIds: true,
  parentFeedbackId: true,
  weight: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  quotes: z.array(z.string()),
  personaIds: z.array(z.string().uuid()).optional(),
  useCaseIds: z.array(z.string().uuid()).optional(),
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

// Merge request/response types
export interface MergeFeedbackRequest {
  teamId: string;
  parentFeedbackId: string;
  childFeedbackIds: string[];
}

export interface MergeFeedbackResponse {
  parent: Feedback;
  mergedCount: number;
}

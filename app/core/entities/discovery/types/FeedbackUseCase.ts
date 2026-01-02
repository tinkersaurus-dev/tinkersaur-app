import { z } from 'zod';

/**
 * FeedbackUseCase junction model
 * Represents the many-to-many relationship between Feedbacks and UseCases
 */

// Zod schema for runtime validation
export const FeedbackUseCaseSchema = z.object({
  id: z.string().uuid(),
  feedbackId: z.string().uuid(),
  useCaseId: z.string().uuid(),
  createdAt: z.date(),
});

// TypeScript type derived from schema
export type FeedbackUseCase = z.infer<typeof FeedbackUseCaseSchema>;

// Schema for creating a new feedback-usecase link (without generated fields)
export const CreateFeedbackUseCaseSchema = FeedbackUseCaseSchema.omit({
  id: true,
  createdAt: true,
});

export type CreateFeedbackUseCaseDto = z.infer<typeof CreateFeedbackUseCaseSchema>;

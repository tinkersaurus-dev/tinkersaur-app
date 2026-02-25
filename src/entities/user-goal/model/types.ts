import { z } from 'zod';
import { QuoteWithSourceSchema } from '@/entities/quote';

/**
 * UserGoal domain model
 * Represents a validated customer need in the Discovery module,
 * backed by evidence (personas, feedback, quotes, intake sources).
 */

// Zod schema for runtime validation
export const UserGoalSchema = z.object({
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  intakeSourceId: z.string().uuid().nullable(),
  mergedIntoId: z.string().uuid().nullable().optional(),
  name: z.string().min(1, 'User goal name is required').max(200),
  description: z.string().max(2000),
  quotes: z.array(QuoteWithSourceSchema),
  personaIds: z.array(z.string().uuid()).default([]),
  solutionId: z.string().uuid().nullable().optional(),
  feedbackIds: z.array(z.string().uuid()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
  personaCount: z.number().default(0),
  problemCount: z.number().default(0),
  suggestionCount: z.number().default(0),
  otherFeedbackCount: z.number().default(0),
  sourceCount: z.number().default(0),
  lastIntakeAt: z.date().nullable().default(null),
});

// TypeScript type derived from schema
export type UserGoal = z.infer<typeof UserGoalSchema>;

// Schema for creating a new user goal (without generated fields)
export const CreateUserGoalSchema = z.object({
  teamId: z.string().uuid(),
  intakeSourceId: z.string().uuid().optional(),
  solutionId: z.string().uuid().optional(),
  name: z.string().min(1, 'User goal name is required').max(200),
  description: z.string().max(2000).optional().default(''),
  quotes: z.array(z.string()).optional(),
  personaIds: z.array(z.string().uuid()).optional(),
});

export type CreateUserGoalDto = z.infer<typeof CreateUserGoalSchema>;

// Schema for updating a user goal (all fields optional except id)
export const UpdateUserGoalSchema = z.object({
  id: z.string().uuid(),
  intakeSourceId: z.string().uuid().nullable().optional(),
  solutionId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  quotes: z.array(z.string()).optional(),
  personaIds: z.array(z.string().uuid()).optional(),
});

export type UpdateUserGoalDto = z.infer<typeof UpdateUserGoalSchema>;

// Similarity matching types
export interface FindSimilarUserGoalsRequest {
  teamId: string;
  name: string;
  description?: string;
  threshold?: number;
  limit?: number;
}

export interface SimilarUserGoalResult {
  userGoal: UserGoal;
  similarity: number;
  matchType: 'name' | 'name+description';
}

// Schema for merged user goal data (output from LLM)
export const MergedUserGoalDataSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export type MergedUserGoalData = z.infer<typeof MergedUserGoalDataSchema>;

// Schema for merge user goals request (to backend API)
export const MergeUserGoalsRequestSchema = z.object({
  teamId: z.string().uuid(),
  targetUserGoalId: z.string().uuid(),
  sourceUserGoalIds: z.array(z.string().uuid()).min(1),
  mergedUserGoal: MergedUserGoalDataSchema.optional(),
  additionalIntakeSourceIds: z.array(z.string().uuid()).optional(),
  quotes: z.array(z.string()).optional(),
});

export type MergeUserGoalsRequest = z.infer<typeof MergeUserGoalsRequestSchema>;

// Promotion request
export interface PromoteUserGoalRequest {
  userGoalId: string;
  solutionId: string;
}

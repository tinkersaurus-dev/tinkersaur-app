import { z } from 'zod';

/**
 * SolutionOverview domain model
 * Stores strategic overview content for a solution (one-to-one relationship)
 */

// Zod schema for runtime validation
export const SolutionOverviewSchema = z.object({
  id: z.string().uuid(),
  solutionId: z.string().uuid(),
  vision: z.string().default(''),
  principles: z.string().default(''),
  targetMarket: z.string().default(''),
  successMetrics: z.string().default(''),
  constraintsAndRisks: z.string().default(''),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript type derived from schema
export type SolutionOverview = z.infer<typeof SolutionOverviewSchema>;

// Schema for updating - all markdown fields optional
export const UpdateSolutionOverviewSchema = z.object({
  vision: z.string().optional(),
  principles: z.string().optional(),
  targetMarket: z.string().optional(),
  successMetrics: z.string().optional(),
  constraintsAndRisks: z.string().optional(),
});

export type UpdateSolutionOverviewDto = z.infer<typeof UpdateSolutionOverviewSchema>;

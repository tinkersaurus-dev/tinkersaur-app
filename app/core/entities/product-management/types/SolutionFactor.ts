import { z } from 'zod';

/**
 * SolutionFactor domain model
 * Represents a discrete strategic factor for a solution (one-to-many relationship)
 */

// Factor type enum
export const SolutionFactorTypeSchema = z.enum([
  'vision',
  'principle',
  'target-market',
  'success-metric',
  'constraint',
  'risk',
]);
export type SolutionFactorType = z.infer<typeof SolutionFactorTypeSchema>;

// Display labels for factor types (plural for section headers)
export const FACTOR_TYPE_LABELS: Record<SolutionFactorType, string> = {
  vision: 'Vision',
  principle: 'Principles',
  'target-market': 'Target Market',
  'success-metric': 'Success Metrics',
  constraint: 'Constraints',
  risk: 'Risks',
};

// Zod schema for runtime validation
export const SolutionFactorSchema = z.object({
  id: z.string().uuid(),
  solutionId: z.string().uuid(),
  type: SolutionFactorTypeSchema,
  active: z.boolean(),
  content: z.string(),
  notes: z.string(),
  targetDate: z.date().nullable(),
  sortOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type SolutionFactor = z.infer<typeof SolutionFactorSchema>;

// Schema for creating a factor
export const CreateSolutionFactorSchema = z.object({
  solutionId: z.string().uuid(),
  type: SolutionFactorTypeSchema,
  content: z.string(),
  notes: z.string().optional().default(''),
  active: z.boolean().optional().default(true),
  targetDate: z.date().nullable().optional(),
  sortOrder: z.number().optional(),
});
export type CreateSolutionFactorDto = z.infer<typeof CreateSolutionFactorSchema>;

// Schema for updating a factor
export const UpdateSolutionFactorSchema = z.object({
  type: SolutionFactorTypeSchema.optional(),
  active: z.boolean().optional(),
  content: z.string().optional(),
  notes: z.string().optional(),
  targetDate: z.date().nullable().optional(),
  sortOrder: z.number().optional(),
});
export type UpdateSolutionFactorDto = z.infer<typeof UpdateSolutionFactorSchema>;

// Schema for bulk creation (from LLM generation)
export const CreateSolutionFactorsBulkSchema = z.object({
  solutionId: z.string().uuid(),
  type: SolutionFactorTypeSchema,
  factors: z.array(
    z.object({
      content: z.string(),
      notes: z.string().optional().default(''),
    })
  ),
});
export type CreateSolutionFactorsBulkDto = z.infer<typeof CreateSolutionFactorsBulkSchema>;

// Schema for reordering factors
export const ReorderSolutionFactorsSchema = z.object({
  factorIds: z.array(z.string().uuid()),
});
export type ReorderSolutionFactorsDto = z.infer<typeof ReorderSolutionFactorsSchema>;

// Helper to group factors by type
export function groupFactorsByType(
  factors: SolutionFactor[]
): Record<SolutionFactorType, SolutionFactor[]> {
  const grouped: Record<SolutionFactorType, SolutionFactor[]> = {
    vision: [],
    principle: [],
    'target-market': [],
    'success-metric': [],
    constraint: [],
    risk: [],
  };

  for (const factor of factors) {
    grouped[factor.type].push(factor);
  }

  // Sort each group by sortOrder
  for (const type of Object.keys(grouped) as SolutionFactorType[]) {
    grouped[type].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return grouped;
}

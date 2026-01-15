import { z } from 'zod';

/**
 * Lightweight requirement reference for storage in DesignWork
 * Stores only the requirement ID; actual text is fetched live on compile
 */
export const RequirementRefSchema = z.object({
  id: z.string().uuid(),
  requirementId: z.string().uuid(),
  order: z.number().int().nonnegative(),
});

export type RequirementRef = z.infer<typeof RequirementRefSchema>;

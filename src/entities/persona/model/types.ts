import { z } from 'zod';
import { QuoteWithSourceSchema } from '@/entities/quote';

/**
 * Persona domain model
 * Represents a user persona that can be linked to multiple use cases across solutions
 */

// Demographics schema for structured persona demographic data
export const DemographicsSchema = z.object({
  education: z.string().max(200).optional(),
  experience: z.string().max(200).optional(),
  industry: z.string().max(200).optional(),
});

export type Demographics = z.infer<typeof DemographicsSchema>;

// Zod schema for runtime validation
export const PersonaSchema = z.object({
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  intakeSourceIds: z.array(z.string().uuid()).default([]),
  name: z.string().min(1, 'Persona name is required').max(200),
  description: z.string().max(2000).default(''),
  role: z.string().max(200).default(''),
  goals: z.array(z.string()).default([]),
  painPoints: z.array(z.string()).default([]),
  demographics: DemographicsSchema.default({}),
  quotes: z.array(QuoteWithSourceSchema).default([]),
  useCaseIds: z.array(z.string().uuid()).default([]),
  feedbackIds: z.array(z.string().uuid()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript type derived from schema
export type Persona = z.infer<typeof PersonaSchema>;

// Schema for creating a new persona (without generated fields)
// Quotes are optional on create - they'll be stored separately and linked
export const CreatePersonaSchema = PersonaSchema.omit({
  id: true,
  quotes: true,
  useCaseIds: true,
  feedbackIds: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  intakeSourceIds: z.array(z.string().uuid()).optional(),
  quotes: z.array(z.string()).optional(),
  useCaseIds: z.array(z.string().uuid()).optional(),
});

export type CreatePersonaDto = z.infer<typeof CreatePersonaSchema>;

// Schema for updating a persona (all fields optional except id)
export const UpdatePersonaSchema = PersonaSchema.partial().required({ id: true });

export type UpdatePersonaDto = z.infer<typeof UpdatePersonaSchema>;

// Schema for finding similar personas
export const FindSimilarPersonasRequestSchema = z.object({
  teamId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  role: z.string().optional(),
  threshold: z.number().min(0).max(1).default(0.3),
  limit: z.number().min(1).max(50).default(10),
});

export type FindSimilarPersonasRequest = z.infer<typeof FindSimilarPersonasRequestSchema>;

// Schema for similar persona results
export const SimilarPersonaResultSchema = z.object({
  persona: PersonaSchema,
  similarity: z.number(),
  matchType: z.string(),
});

export type SimilarPersonaResult = z.infer<typeof SimilarPersonaResultSchema>;

// Schema for merged persona data (output from LLM)
export const MergedPersonaDataSchema = z.object({
  name: z.string(),
  description: z.string(),
  role: z.string(),
  goals: z.array(z.string()),
  painPoints: z.array(z.string()),
  demographics: DemographicsSchema.optional(),
});

export type MergedPersonaData = z.infer<typeof MergedPersonaDataSchema>;

// Schema for merge personas request (to backend API)
// Merges source personas INTO the target persona (first selected)
export const MergePersonasRequestSchema = z.object({
  teamId: z.string().uuid(),
  targetPersonaId: z.string().uuid(),
  sourcePersonaIds: z.array(z.string().uuid()),
  mergedPersona: MergedPersonaDataSchema.optional(), // Optional for simple merge mode
  additionalIntakeSourceIds: z.array(z.string().uuid()).optional(),
  quotes: z.array(z.string()).optional(), // Quotes from intake persona to link to target
});

export type MergePersonasRequest = z.infer<typeof MergePersonasRequestSchema>;

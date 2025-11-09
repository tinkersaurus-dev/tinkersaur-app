import { z } from 'zod';
import { DiagramTypeSchema } from './Diagram';
import { InterfaceFidelitySchema } from './Interface';

/**
 * Design Work domain model
 * Represents a folder in the design studio tree.
 * Design works are the primary organizational unit for design content.
 * They are associated with a solution and can optionally be linked to specific features or changes.
 * Design works can be nested to create a folder hierarchy.
 *
 * Design works now include metadata about their content (diagrams, interfaces, documents)
 * to enable efficient tree building without loading full content upfront.
 */

/**
 * Content item reference types
 * These represent metadata about content items stored in a design work.
 * The actual content is lazy-loaded when the user opens it.
 */

// Diagram reference with metadata
export const DiagramRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  type: DiagramTypeSchema,
  order: z.number().int().nonnegative(),
});

export type DiagramRef = z.infer<typeof DiagramRefSchema>;

// Interface reference with metadata
export const InterfaceRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  fidelity: InterfaceFidelitySchema,
  order: z.number().int().nonnegative(),
});

export type InterfaceRef = z.infer<typeof InterfaceRefSchema>;

// Document reference with metadata
export const DocumentRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  order: z.number().int().nonnegative(),
});

export type DocumentRef = z.infer<typeof DocumentRefSchema>;

// Zod schema for runtime validation
export const DesignWorkSchema = z.object({
  id: z.string().uuid(),
  solutionId: z.string().uuid(),
  featureId: z.string().uuid().optional(),
  changeId: z.string().uuid().optional(),
  parentDesignWorkId: z.string().uuid().optional(),
  name: z.string().min(1, 'Design work name is required').max(200),
  version: z.string().min(1, 'Version is required'),
  diagrams: z.array(DiagramRefSchema).default([]),
  interfaces: z.array(InterfaceRefSchema).default([]),
  documents: z.array(DocumentRefSchema).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript type derived from schema
export type DesignWork = z.infer<typeof DesignWorkSchema>;

// Schema for creating (without generated fields)
export const CreateDesignWorkSchema = DesignWorkSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateDesignWorkDto = z.infer<typeof CreateDesignWorkSchema>;

// Schema for updating (all fields optional except id)
export const UpdateDesignWorkSchema = DesignWorkSchema.partial().required({ id: true });

export type UpdateDesignWorkDto = z.infer<typeof UpdateDesignWorkSchema>;

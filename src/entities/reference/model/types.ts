import { z } from 'zod';

/**
 * Content types that can contain references
 */
export const ContentTypeSchema = z.enum(['diagram', 'document', 'interface']);
export type ContentType = z.infer<typeof ContentTypeSchema>;

/**
 * Reference types define how a reference behaves when used
 */
export const ReferenceTypeSchema = z.enum(['link']);
export type ReferenceType = z.infer<typeof ReferenceTypeSchema>;

/**
 * Drop target types for references
 */
export const DropTargetSchema = z.enum(['canvas', 'folder']);
export type DropTarget = z.infer<typeof DropTargetSchema>;

/**
 * Full Reference entity
 * Represents a reusable reference that can be dragged into other content
 */
export const ReferenceSchema = z.object({
  id: z.string().uuid(),
  designWorkId: z.string().uuid(),
  name: z.string(),
  contentType: ContentTypeSchema,
  contentId: z.string().uuid(),
  sourceShapeId: z.string(),
  referenceType: ReferenceTypeSchema,
  metadata: z
    .object({
      sourceShapeType: z.string(),
      sourceShapeSubtype: z.string().optional(),
      diagramType: z.string().optional(), // For diagram references
      dropTarget: DropTargetSchema.optional(), // 'canvas' for BPMN, 'folder' for Class
    })
    .optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Reference = z.infer<typeof ReferenceSchema>;

/**
 * Lightweight reference metadata for display in trees/lists
 * Stored in DesignWork entity
 */
export const ReferenceRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  referenceType: ReferenceTypeSchema,
  order: z.number().int().nonnegative(),
});

export type ReferenceRef = z.infer<typeof ReferenceRefSchema>;

/**
 * DTO for creating a new reference
 */
export const CreateReferenceSchema = ReferenceSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateReference = z.infer<typeof CreateReferenceSchema>;

/**
 * DTO for updating a reference
 */
export const UpdateReferenceSchema = ReferenceSchema.partial().required({
  id: true,
});

export type UpdateReference = z.infer<typeof UpdateReferenceSchema>;

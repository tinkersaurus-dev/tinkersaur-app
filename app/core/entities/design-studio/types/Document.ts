import { z } from 'zod';

/**
 * Document domain model
 * Represents markdown documentation
 * Documents belong to a DesignWork (folder) in the tree hierarchy
 */

// Zod schema for runtime validation
export const DocumentSchema = z.object({
  id: z.string().uuid(),
  designWorkId: z.string().uuid(),
  name: z.string().min(1, 'Document name is required').max(200),
  content: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript type derived from schema
export type Document = z.infer<typeof DocumentSchema>;

// Schema for creating (without generated fields)
export const CreateDocumentSchema = DocumentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateDocumentDto = z.infer<typeof CreateDocumentSchema>;

// Schema for updating (all fields optional except id)
export const UpdateDocumentSchema = DocumentSchema.partial().required({ id: true });

export type UpdateDocumentDto = z.infer<typeof UpdateDocumentSchema>;

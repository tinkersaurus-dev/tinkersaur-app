import { z } from 'zod';

/**
 * Diagram domain model
 * Represents a diagram (BPMN, DataFlow, Class, Sequence)
 * Diagrams belong to a DesignWork (folder) in the tree hierarchy
 */

// Diagram type enum
export const DiagramTypeSchema = z.enum(['bpmn', 'dataflow', 'class', 'sequence']);
export type DiagramType = z.infer<typeof DiagramTypeSchema>;

// Zod schema for runtime validation
export const DiagramSchema = z.object({
  id: z.string().uuid(),
  designWorkId: z.string().uuid(),
  name: z.string().min(1, 'Diagram name is required').max(200),
  type: DiagramTypeSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript type derived from schema
export type Diagram = z.infer<typeof DiagramSchema>;

// Schema for creating (without generated fields)
export const CreateDiagramSchema = DiagramSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateDiagramDto = z.infer<typeof CreateDiagramSchema>;

// Schema for updating (all fields optional except id)
export const UpdateDiagramSchema = DiagramSchema.partial().required({ id: true });

export type UpdateDiagramDto = z.infer<typeof UpdateDiagramSchema>;

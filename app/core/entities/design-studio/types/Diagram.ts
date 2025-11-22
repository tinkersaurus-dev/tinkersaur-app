import { z } from 'zod';
import { ShapeSchema } from './Shape';
import { ConnectorSchema } from './Connector';

/**
 * Diagram domain model
 * Represents a diagram (BPMN, DataFlow, Class, Sequence, Architecture)
 * Diagrams belong to a DesignWork (folder) in the tree hierarchy
 *
 * A diagram contains its complete content including shapes and connectors.
 * When saved to storage or transmitted to the backend, the entire diagram is handled as one unit.
 *
 * NOTE: Viewport state (zoom, pan) is NOT persisted - it's ephemeral canvas UI state only.
 */

// Diagram type enum
export const DiagramTypeSchema = z.enum(['bpmn', 'dataflow', 'class', 'sequence', 'architecture']);
export type DiagramType = z.infer<typeof DiagramTypeSchema>;

// Zod schema for runtime validation
export const DiagramSchema = z.object({
  id: z.string().uuid(),
  designWorkId: z.string().uuid(),
  name: z.string().min(1, 'Diagram name is required').max(200),
  type: DiagramTypeSchema,
  // Diagram content - shapes and connectors live within the diagram
  shapes: z.array(ShapeSchema).default([]),
  connectors: z.array(ConnectorSchema).default([]),
  // Cached mermaid export - auto-generated and persisted for reuse across the app
  mermaidSyntax: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript type derived from schema
export type Diagram = z.infer<typeof DiagramSchema>;

// Schema for creating (without generated fields)
// Shapes and connectors are optional during creation (will default to empty)
export const CreateDiagramSchema = DiagramSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  shapes: true,
  connectors: true,
}).extend({
  shapes: z.array(ShapeSchema).optional(),
  connectors: z.array(ConnectorSchema).optional(),
});

export type CreateDiagramDto = z.infer<typeof CreateDiagramSchema>;

// Schema for updating (all fields optional except id)
export const UpdateDiagramSchema = DiagramSchema.partial().required({ id: true });

export type UpdateDiagramDto = z.infer<typeof UpdateDiagramSchema>;

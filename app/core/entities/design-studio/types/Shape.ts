import { z } from 'zod';

// Point type for coordinates
export const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export type Point = z.infer<typeof PointSchema>;

// Size type for dimensions
export const SizeSchema = z.object({
  width: z.number(),
  height: z.number(),
});

export type Size = z.infer<typeof SizeSchema>;

// Shape entity - represents a shape on the canvas
export const ShapeSchema = z.object({
  id: z.string(),
  type: z.string(), // 'rectangle', 'circle', 'bpmn-task', etc.
  subtype: z.string().optional(), // Optional subtype for categorization (e.g., 'user', 'service', 'script' for bpmn-task)
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  label: z.string().optional(), // Optional text label for the shape
  zIndex: z.number().default(0),
  locked: z.boolean().default(false),
  // Optional hierarchy support for complex diagrams
  parentId: z.string().optional(),
  children: z.array(z.string()).optional(),
});

export type Shape = z.infer<typeof ShapeSchema>;

// DTOs for shape creation/updates
export const CreateShapeSchema = ShapeSchema.omit({ id: true });
export type CreateShapeDTO = z.infer<typeof CreateShapeSchema>;

export const UpdateShapeSchema = ShapeSchema.partial().required({ id: true });
export type UpdateShapeDTO = z.infer<typeof UpdateShapeSchema>;

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
  // Optional type-specific data (e.g., for class diagrams: stereotype, attributes, methods)
  data: z.record(z.string(), z.unknown()).optional(),
});

export type Shape = z.infer<typeof ShapeSchema>;

// DTOs for shape creation/updates
export const CreateShapeSchema = ShapeSchema.omit({ id: true });
export type CreateShapeDTO = z.infer<typeof CreateShapeSchema>;

export const UpdateShapeSchema = ShapeSchema.partial().required({ id: true });
export type UpdateShapeDTO = z.infer<typeof UpdateShapeSchema>;

// Type-specific shape data types

// Class diagram shape data
export interface ClassShapeData {
  stereotype?: string; // UML stereotype (e.g., 'interface', 'abstract', 'entity')
  attributes: string[]; // Array of attribute strings (e.g., '+ name: string')
  methods: string[]; // Array of method strings (e.g., '+ getName(): string')
}

// Type guard for class shape data
export function isClassShapeData(data: unknown): data is ClassShapeData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    (d.stereotype === undefined || typeof d.stereotype === 'string') &&
    Array.isArray(d.attributes) &&
    d.attributes.every((attr) => typeof attr === 'string') &&
    Array.isArray(d.methods) &&
    d.methods.every((method) => typeof method === 'string')
  );
}

// Sequence diagram lifeline activation box
export interface ActivationBox {
  startY: number; // Y-coordinate where activation starts (relative to lifeline)
  endY: number; // Y-coordinate where activation ends (relative to lifeline)
  depth: number; // Nesting depth for nested activations (0 = outermost)
}

// Sequence diagram lifeline shape data
export interface SequenceLifelineData {
  lifelineStyle: 'solid' | 'dashed'; // Style of the vertical lifeline
  activations: ActivationBox[]; // Auto-generated activation boxes
  isDestroyed?: boolean; // Whether this lifeline has been destroyed
  destroyedAtY?: number; // Y-coordinate where destruction occurs
}

// Type guard for sequence lifeline data
export function isSequenceLifelineData(data: unknown): data is SequenceLifelineData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    (d.lifelineStyle === 'solid' || d.lifelineStyle === 'dashed') &&
    Array.isArray(d.activations) &&
    d.activations.every(
      (activation: unknown) =>
        activation &&
        typeof activation === 'object' &&
        typeof (activation as ActivationBox).startY === 'number' &&
        typeof (activation as ActivationBox).endY === 'number' &&
        typeof (activation as ActivationBox).depth === 'number'
    ) &&
    (d.isDestroyed === undefined || typeof d.isDestroyed === 'boolean') &&
    (d.destroyedAtY === undefined || typeof d.destroyedAtY === 'number')
  );
}

import { z } from 'zod';

/**
 * Interface domain model
 * Represents UI wireframes/mockups
 * Interfaces belong to a DesignWork (folder) in the tree hierarchy
 */

// Interface fidelity enum
export const InterfaceFidelitySchema = z.enum(['low', 'medium', 'high']);
export type InterfaceFidelity = z.infer<typeof InterfaceFidelitySchema>;

// Zod schema for runtime validation
export const InterfaceSchema = z.object({
  id: z.string().uuid(),
  designWorkId: z.string().uuid(),
  name: z.string().min(1, 'Interface name is required').max(200),
  fidelity: InterfaceFidelitySchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript type derived from schema
export type Interface = z.infer<typeof InterfaceSchema>;

// Schema for creating (without generated fields)
export const CreateInterfaceSchema = InterfaceSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateInterfaceDto = z.infer<typeof CreateInterfaceSchema>;

// Schema for updating (all fields optional except id)
export const UpdateInterfaceSchema = InterfaceSchema.partial().required({ id: true });

export type UpdateInterfaceDto = z.infer<typeof UpdateInterfaceSchema>;

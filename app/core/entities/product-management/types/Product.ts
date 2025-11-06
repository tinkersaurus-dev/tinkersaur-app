import { z } from 'zod';

/**
 * Product domain model
 * Represents a product in the system
 */

// Zod schema for runtime validation
export const ProductSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().max(2000),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript type derived from schema
export type Product = z.infer<typeof ProductSchema>;

// Schema for creating a new product (without generated fields)
export const CreateProductSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateProductDto = z.infer<typeof CreateProductSchema>;

// Schema for updating a product (all fields optional except id)
export const UpdateProductSchema = ProductSchema.partial().required({ id: true });

export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;

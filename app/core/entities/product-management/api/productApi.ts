import { v4 as uuidv4 } from 'uuid';
import type { Product, CreateProductDto, UpdateProductDto } from '../types';
import { getFromStorage, saveToStorage, simulateDelay } from './storage';

const STORAGE_KEY = 'products';

/**
 * Product API Client
 * Mock implementation with localStorage persistence
 */
class ProductApi {
  /**
   * Get all products for an organization
   */
  async list(organizationId: string): Promise<Product[]> {
    await simulateDelay();
    const products = getFromStorage<Product>(STORAGE_KEY);
    return products.filter((p) => p.organizationId === organizationId);
  }

  /**
   * Get a single product by ID
   */
  async get(id: string): Promise<Product | null> {
    await simulateDelay();
    const products = getFromStorage<Product>(STORAGE_KEY);
    return products.find((p) => p.id === id) || null;
  }

  /**
   * Create a new product
   */
  async create(data: CreateProductDto): Promise<Product> {
    await simulateDelay();

    const product: Product = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const products = getFromStorage<Product>(STORAGE_KEY);
    products.push(product);
    saveToStorage(STORAGE_KEY, products);

    return product;
  }

  /**
   * Update an existing product
   */
  async update(id: string, updates: Partial<UpdateProductDto>): Promise<Product | null> {
    await simulateDelay();

    const products = getFromStorage<Product>(STORAGE_KEY);
    const index = products.findIndex((p) => p.id === id);

    if (index === -1) {
      return null;
    }

    products[index] = {
      ...products[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    saveToStorage(STORAGE_KEY, products);
    return products[index];
  }

  /**
   * Delete a product
   */
  async delete(id: string): Promise<boolean> {
    await simulateDelay();

    const products = getFromStorage<Product>(STORAGE_KEY);
    const filtered = products.filter((p) => p.id !== id);

    if (filtered.length === products.length) {
      return false; // Product not found
    }

    saveToStorage(STORAGE_KEY, filtered);
    return true;
  }
}

export const productApi = new ProductApi();

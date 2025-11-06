# Entity Pipeline Architecture Guide

## Overview

The Entity Pipeline is a standardized architecture for managing data entities in the Tinkersaurus application. It provides a clean separation between entity logic, API integration, and UI concerns, making code more maintainable and reusable across modules.

## Architecture Layers

The Entity Pipeline consists of four main layers:

```
┌─────────────────────────────────────────────────────────┐
│                    UI Components                        │
│            (Routes, Pages, Components)                  │
└─────────────────────┬───────────────────────────────────┘
                      │ uses
┌─────────────────────▼───────────────────────────────────┐
│                  Custom Hooks                           │
│        (Data Access + CRUD Operations)                  │
└─────────┬────────────────────────┬──────────────────────┘
          │ uses                   │ uses
┌─────────▼──────────┐   ┌─────────▼──────────────────────┐
│  Entity Store      │   │  UI Store                      │
│  (Entity State +   │   │  (UI State Only)               │
│   CRUD Logic)      │   │  - Selections                  │
└─────────┬──────────┘   │  - Modal states                │
          │              │  - Form states                 │
          │ uses         └────────────────────────────────┘
┌─────────▼──────────────────────────────────────────────┐
│                    API Layer                            │
│         (Mock/Real API Clients)                        │
└─────────┬───────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────┐
│                 Data Sources                            │
│      (localStorage, Backend API, etc.)                  │
└─────────────────────────────────────────────────────────┘
```

## Directory Structure

```
app/
├── core/
│   └── entities/
│       └── {module-name}/           # e.g., product-management
│           ├── types/                # Type definitions + Zod schemas
│           │   ├── {Entity}.ts
│           │   └── index.ts
│           ├── api/                  # API clients
│           │   ├── {entity}Api.ts
│           │   ├── storage.ts        # localStorage utilities (if needed)
│           │   └── index.ts
│           ├── store/                # Entity state management
│           │   ├── {module}EntityStore.ts
│           │   └── index.ts
│           └── index.ts              # Public API exports
│
└── {module-name}/                   # e.g., product-management
    ├── hooks/                        # Custom hooks
    │   ├── use{Entities}.ts         # Data access hooks
    │   ├── useCRUD.ts               # CRUD operation hooks
    │   └── index.ts
    ├── store/                        # UI-only state
    │   ├── {module}UIStore.ts
    │   └── index.ts
    ├── routes/                       # Page components
    └── components/                   # Shared components (optional)
```

## Layer-by-Layer Guide

### 1. Types Layer (`core/entities/{module}/types/`)

Define your entity types with both TypeScript interfaces and Zod schemas for runtime validation.

**Example: Product.ts**
```typescript
import { z } from 'zod';

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

// Schema for creating (without generated fields)
export const CreateProductSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateProductDto = z.infer<typeof CreateProductSchema>;

// Schema for updating (all fields optional except id)
export const UpdateProductSchema = ProductSchema.partial().required({ id: true });

export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;
```

**Best Practices:**
- Always provide both Zod schemas and TypeScript types
- Create separate DTOs for Create, Update, and Read operations
- Add validation rules in the Zod schema (min, max, required, etc.)
- Export everything from `index.ts`

### 2. API Layer (`core/entities/{module}/api/`)

Create API client classes that abstract data fetching logic.

**Example: productApi.ts**
```typescript
import { v4 as uuidv4 } from 'uuid';
import type { Product, CreateProductDto, UpdateProductDto } from '../types';
import { getFromStorage, saveToStorage, simulateDelay } from './storage';

const STORAGE_KEY = 'products';

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
      id,
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
      return false;
    }

    saveToStorage(STORAGE_KEY, filtered);
    return true;
  }
}

export const productApi = new ProductApi();
```

**Best Practices:**
- Use async/await for all operations
- Return appropriate types (entities, null, boolean)
- Add simulated delays for realistic UX during development
- Keep localStorage operations SSR-safe (check for browser environment)
- Design the API interface to match your future backend structure

### 3. Entity Store (`core/entities/{module}/store/`)

Use Zustand to manage entity state with per-entity loading and error states.

**Example: productManagementEntityStore.ts**
```typescript
import { create } from 'zustand';
import type { Product, CreateProductDto } from '../types';
import { productApi } from '../api';
import { toast } from '~/core/utils/toast';

interface ProductManagementEntityStore {
  // Entity state
  products: Product[];

  // Loading states (per-entity)
  loading: {
    products: boolean;
  };

  // Error states (per-entity)
  errors: {
    products: Error | null;
  };

  // Actions
  fetchProducts: (organizationId: string) => Promise<void>;
  createProduct: (data: CreateProductDto) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

export const useProductManagementEntityStore = create<ProductManagementEntityStore>((set, get) => ({
  products: [],

  loading: {
    products: false,
  },

  errors: {
    products: null,
  },

  fetchProducts: async (organizationId: string) => {
    set((state) => ({
      loading: { ...state.loading, products: true },
      errors: { ...state.errors, products: null },
    }));

    try {
      const products = await productApi.list(organizationId);
      set((state) => ({
        products,
        loading: { ...state.loading, products: false },
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch products');
      set((state) => ({
        loading: { ...state.loading, products: false },
        errors: { ...state.errors, products: err },
      }));
      toast.error('Failed to load products');
    }
  },

  createProduct: async (data: CreateProductDto) => {
    set((state) => ({
      loading: { ...state.loading, products: true },
      errors: { ...state.errors, products: null },
    }));

    try {
      const product = await productApi.create(data);
      set((state) => ({
        products: [...state.products, product],
        loading: { ...state.loading, products: false },
      }));
      toast.success('Product created successfully');
      return product;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create product');
      set((state) => ({
        loading: { ...state.loading, products: false },
        errors: { ...state.errors, products: err },
      }));
      toast.error('Failed to create product');
      throw error;
    }
  },

  // ... similar for update and delete
}));
```

**Best Practices:**
- Use per-entity loading/error states for granular UI feedback
- Always set loading to true at the start of async operations
- Handle errors gracefully with toast notifications
- Reset loading to false in both success and error cases
- Keep operations async and return appropriate values

### 4. Custom Hooks (`{module}/hooks/`)

Create reusable hooks that combine entity and UI stores.

**Example: useProducts.ts (Data Access)**
```typescript
import { useEffect } from 'react';
import { useProductManagementEntityStore } from '~/core/entities/product-management';

export function useProducts(organizationId: string) {
  const products = useProductManagementEntityStore((state) => state.products);
  const loading = useProductManagementEntityStore((state) => state.loading.products);
  const error = useProductManagementEntityStore((state) => state.errors.products);
  const fetchProducts = useProductManagementEntityStore((state) => state.fetchProducts);

  useEffect(() => {
    fetchProducts(organizationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]); // Only re-fetch when organizationId changes

  return { products, loading, error };
}
```

**Example: useCRUD.ts (CRUD Operations)**
```typescript
import { useCallback } from 'react';
import { useProductManagementEntityStore, type CreateProductDto } from '~/core/entities/product-management';
import { useProductManagementUIStore } from '../store/productManagementUIStore';

export function useProductCRUD() {
  const createProduct = useProductManagementEntityStore((state) => state.createProduct);
  const updateProduct = useProductManagementEntityStore((state) => state.updateProduct);
  const deleteProduct = useProductManagementEntityStore((state) => state.deleteProduct);

  const closeModal = useProductManagementUIStore((state) => state.closeModal);

  const handleCreate = useCallback(
    async (data: CreateProductDto) => {
      const product = await createProduct(data);
      closeModal('addProduct');
      return product;
    },
    [createProduct, closeModal]
  );

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<Product>) => {
      await updateProduct(id, updates);
      closeModal('editProduct');
    },
    [updateProduct, closeModal]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteProduct(id);
      closeModal('deleteProduct');
    },
    [deleteProduct, closeModal]
  );

  return { handleCreate, handleUpdate, handleDelete };
}
```

**Best Practices:**
- Only include data parameter(s) in useEffect dependencies (not store functions)
- Use `useMemo` when filtering arrays to prevent infinite loops
- Use `useCallback` for CRUD operations to maintain stable references
- Combine entity and UI store operations in CRUD hooks
- Add eslint-disable for exhaustive-deps when intentionally omitting store functions

### 5. UI Store (`{module}/store/`)

Manage UI-specific state separately from entity data.

**Example: productManagementUIStore.ts**
```typescript
import { create } from 'zustand';
import type { Product } from '~/core/entities/product-management';

interface ProductManagementUIStore {
  // Selection state
  selectedProductId: string | null;

  // Modal states
  modals: {
    addProduct: boolean;
    editProduct: boolean;
    deleteProduct: boolean;
  };

  // Editing state
  editingProduct: Product | null;

  // Actions
  setSelectedProductId: (id: string | null) => void;
  openModal: (modalName: keyof ProductManagementUIStore['modals']) => void;
  closeModal: (modalName: keyof ProductManagementUIStore['modals']) => void;
  setEditingProduct: (product: Product | null) => void;
}

export const useProductManagementUIStore = create<ProductManagementUIStore>((set) => ({
  selectedProductId: null,

  modals: {
    addProduct: false,
    editProduct: false,
    deleteProduct: false,
  },

  editingProduct: null,

  setSelectedProductId: (id) => set({ selectedProductId: id }),

  openModal: (modalName) =>
    set((state) => ({
      modals: { ...state.modals, [modalName]: true },
    })),

  closeModal: (modalName) =>
    set((state) => ({
      modals: { ...state.modals, [modalName]: false },
    })),

  setEditingProduct: (product) => set({ editingProduct: product }),
}));
```

**Best Practices:**
- Keep ONLY UI state here (no entity data)
- Include: selections, modal visibility, form states, UI flags
- Keep actions simple and synchronous
- Use meaningful action names

### 6. UI Components (`{module}/routes/`)

Use custom hooks in your components for clean, simple code.

**Example: products-list.tsx**
```typescript
import { useState } from 'react';
import type { Product } from '~/core/entities/product-management';
import { useProducts, useProductCRUD } from '../hooks';

export default function ProductsListPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Use custom hooks
  const { products, loading } = useProducts('org-1');
  const { handleCreate, handleUpdate, handleDelete } = useProductCRUD();

  const handleOk = async () => {
    const values = form.getValues();

    if (editingProduct) {
      await handleUpdate(editingProduct.id, values);
    } else {
      await handleCreate({
        organizationId: 'org-1',
        ...values,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <AppLayout>
      <Table
        dataSource={products}
        loading={loading}
        // ...
      />
    </AppLayout>
  );
}
```

**Best Practices:**
- Use custom hooks instead of accessing stores directly
- Keep component logic focused on UI concerns
- Let hooks handle data fetching and state management
- Use loading states for better UX

## Common Patterns

### Filtering Data with useMemo

When you need to filter entity data based on relationships:

```typescript
import { useMemo } from 'react';

export function useFeatures(productId: string | undefined) {
  const allFeatures = useProductManagementEntityStore((state) => state.features);
  const loading = useProductManagementEntityStore((state) => state.loading.features);

  // ✅ CORRECT: Use useMemo to prevent infinite loops
  const features = useMemo(
    () => (productId ? allFeatures.filter((f) => f.productId === productId) : []),
    [allFeatures, productId]
  );

  return { features, loading };
}
```

**❌ WRONG: Don't filter directly in selector**
```typescript
// This causes infinite loops!
const features = useStore((state) =>
  productId ? state.getFeaturesByProductId(productId) : []
);
```

### Cascade Deletes

Handle related entity cleanup:

```typescript
deleteProduct: async (id: string) => {
  // Get related entity IDs before deletion
  const featureIds = get().features
    .filter((f) => f.productId === id)
    .map((f) => f.id);

  const changeIds = get().changes
    .filter((c) => featureIds.includes(c.featureId))
    .map((c) => c.id);

  // Delete from API
  await productApi.delete(id);

  // Cascade delete from local state
  set((state) => ({
    products: state.products.filter((p) => p.id !== id),
    features: state.features.filter((f) => f.productId !== id),
    changes: state.changes.filter((c) => !featureIds.includes(c.featureId)),
    requirements: state.requirements.filter((r) => !changeIds.includes(r.changeId)),
  }));

  // Delete related entities from API
  for (const featureId of featureIds) {
    await featureApi.delete(featureId);
  }
  // ... continue for all related entities
}
```

### SSR-Safe localStorage

Always check for browser environment:

```typescript
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export function getFromStorage<T>(key: string): T[] {
  if (!isBrowser) {
    return [];
  }

  const data = localStorage.getItem(key);
  // ... rest of implementation
}
```

## Migration Guide

### Migrating Existing Code to Entity Pipeline

1. **Create the entity structure**
   ```bash
   mkdir -p app/core/entities/{module-name}/{types,api,store}
   ```

2. **Move types and add Zod schemas**
   - Move existing type files to `core/entities/{module}/types/`
   - Add Zod schemas alongside TypeScript types
   - Create Create/Update DTOs

3. **Create API layer**
   - Extract API calls into API client classes
   - Add mock data if needed
   - Implement CRUD methods

4. **Create entity store**
   - Move entity state from old store
   - Add loading and error states
   - Make all operations async
   - Call API layer from actions

5. **Create UI store**
   - Move UI-specific state (selections, modals, etc.)
   - Remove all entity data

6. **Create custom hooks**
   - Create data access hooks (use{Entity}, use{Entities})
   - Create CRUD hooks (use{Entity}CRUD)
   - Use useMemo for filtering operations

7. **Update components**
   - Replace direct store access with custom hooks
   - Update import paths
   - Add loading state handling

8. **Cleanup**
   - Delete old store file
   - Delete old types directory
   - Search for orphaned imports
   - Test build

## Troubleshooting

### Infinite Loop Errors

**Problem:** "Maximum update depth exceeded" or "getSnapshot should be cached"

**Solution:** Use `useMemo` when filtering arrays in hooks:

```typescript
// ✅ Correct
const features = useMemo(
  () => allFeatures.filter((f) => f.productId === productId),
  [allFeatures, productId]
);

// ❌ Wrong
const features = useStore((state) =>
  state.features.filter((f) => f.productId === productId)
);
```

### localStorage is not defined

**Problem:** SSR tries to access localStorage

**Solution:** Add browser checks:

```typescript
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

if (!isBrowser) {
  return [];
}
```

### useEffect Running Infinitely

**Problem:** Store functions in dependency array

**Solution:** Only include data parameters:

```typescript
useEffect(() => {
  fetchProducts(organizationId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [organizationId]); // Don't include fetchProducts
```

## Benefits

1. **Separation of Concerns**: Entity logic separate from UI logic
2. **Reusability**: Entity stores can be used across modules
3. **Type Safety**: Zod runtime validation + TypeScript types
4. **Testability**: Each layer can be tested independently
5. **Maintainability**: Clear structure makes code easy to find and modify
6. **Scalability**: Easy to add new entities following the same pattern
7. **Performance**: Per-entity loading states prevent unnecessary re-renders
8. **Developer Experience**: Consistent patterns reduce cognitive load

## Next Steps

- Apply this pattern to other modules (Design Studio, etc.)
- Swap mock API for real backend when ready
- Add more sophisticated error handling
- Implement optimistic updates
- Add data caching strategies
- Consider using React Query for advanced data fetching needs

---

**Questions?** Refer to the Product Management implementation in `app/core/entities/product-management/` and `app/product-management/` for a complete working example.

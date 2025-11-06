/**
 * Product Management Entity Store
 * Zustand store managing entity state and async CRUD operations
 */

import { create } from 'zustand';
import type {
  Product,
  Feature,
  Change,
  Requirement,
  CreateProductDto,
  CreateFeatureDto,
  CreateChangeDto,
  CreateRequirementDto,
} from '../types';
import { productApi, featureApi, changeApi, requirementApi } from '../api';
import { toast } from '~/core/utils/toast';

interface LoadingState {
  products: boolean;
  features: boolean;
  changes: boolean;
  requirements: boolean;
}

interface ErrorState {
  products: Error | null;
  features: Error | null;
  changes: Error | null;
  requirements: Error | null;
}

interface ProductManagementEntityStore {
  // Entity state
  products: Product[];
  features: Feature[];
  changes: Change[];
  requirements: Requirement[];

  // Loading states
  loading: LoadingState;

  // Error states
  errors: ErrorState;

  // Product actions
  fetchProducts: (organizationId: string) => Promise<void>;
  fetchProduct: (id: string) => Promise<Product | null>;
  createProduct: (data: CreateProductDto) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Feature actions
  fetchFeaturesByProduct: (productId: string) => Promise<void>;
  fetchFeature: (id: string) => Promise<Feature | null>;
  createFeature: (data: CreateFeatureDto) => Promise<Feature>;
  updateFeature: (id: string, updates: Partial<Feature>) => Promise<void>;
  deleteFeature: (id: string) => Promise<void>;

  // Change actions
  fetchChangesByFeature: (featureId: string) => Promise<void>;
  fetchChange: (id: string) => Promise<Change | null>;
  createChange: (data: CreateChangeDto) => Promise<Change>;
  updateChange: (id: string, updates: Partial<Change>) => Promise<void>;
  deleteChange: (id: string) => Promise<void>;

  // Requirement actions
  fetchRequirementsByChange: (changeId: string) => Promise<void>;
  fetchRequirement: (id: string) => Promise<Requirement | null>;
  createRequirement: (data: CreateRequirementDto) => Promise<Requirement>;
  updateRequirement: (id: string, updates: Partial<Requirement>) => Promise<void>;
  deleteRequirement: (id: string) => Promise<void>;

  // Relationship queries (synchronous, for already-loaded data)
  getFeaturesByProductId: (productId: string) => Feature[];
  getChangesByFeatureId: (featureId: string) => Change[];
  getRequirementsByChangeId: (changeId: string) => Requirement[];
}

export const useProductManagementEntityStore = create<ProductManagementEntityStore>((set, get) => ({
  // Initial state
  products: [],
  features: [],
  changes: [],
  requirements: [],

  loading: {
    products: false,
    features: false,
    changes: false,
    requirements: false,
  },

  errors: {
    products: null,
    features: null,
    changes: null,
    requirements: null,
  },

  // ==================== PRODUCT ACTIONS ====================

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

  fetchProduct: async (id: string) => {
    // Check if already in store
    const existing = get().products.find((p) => p.id === id);
    if (existing) return existing;

    set((state) => ({
      loading: { ...state.loading, products: true },
      errors: { ...state.errors, products: null },
    }));

    try {
      const product = await productApi.get(id);
      if (product) {
        set((state) => ({
          products: [...state.products.filter((p) => p.id !== id), product],
          loading: { ...state.loading, products: false },
        }));
      } else {
        set((state) => ({
          loading: { ...state.loading, products: false },
        }));
      }
      return product;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch product');
      set((state) => ({
        loading: { ...state.loading, products: false },
        errors: { ...state.errors, products: err },
      }));
      toast.error('Failed to load product');
      return null;
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

  updateProduct: async (id: string, updates: Partial<Product>) => {
    set((state) => ({
      loading: { ...state.loading, products: true },
      errors: { ...state.errors, products: null },
    }));

    try {
      const updated = await productApi.update(id, updates);
      if (updated) {
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? updated : p)),
          loading: { ...state.loading, products: false },
        }));
        toast.success('Product updated successfully');
      } else {
        throw new Error('Product not found');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update product');
      set((state) => ({
        loading: { ...state.loading, products: false },
        errors: { ...state.errors, products: err },
      }));
      toast.error('Failed to update product');
      throw error;
    }
  },

  deleteProduct: async (id: string) => {
    set((state) => ({
      loading: { ...state.loading, products: true },
      errors: { ...state.errors, products: null },
    }));

    try {
      // Get related entity IDs before deletion
      const featureIds = get().features.filter((f) => f.productId === id).map((f) => f.id);
      const changeIds = get()
        .changes.filter((c) => featureIds.includes(c.featureId))
        .map((c) => c.id);

      // Delete from API
      await productApi.delete(id);

      // Cascade delete from local state
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
        features: state.features.filter((f) => f.productId !== id),
        changes: state.changes.filter((c) => !featureIds.includes(c.featureId)),
        requirements: state.requirements.filter((r) => !changeIds.includes(r.changeId)),
        loading: { ...state.loading, products: false },
      }));

      // Also delete related entities from API
      for (const featureId of featureIds) {
        await featureApi.delete(featureId);
      }
      for (const changeId of changeIds) {
        await changeApi.delete(changeId);
      }
      const requirementIds = get()
        .requirements.filter((r) => changeIds.includes(r.changeId))
        .map((r) => r.id);
      for (const reqId of requirementIds) {
        await requirementApi.delete(reqId);
      }

      toast.success('Product deleted successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete product');
      set((state) => ({
        loading: { ...state.loading, products: false },
        errors: { ...state.errors, products: err },
      }));
      toast.error('Failed to delete product');
      throw error;
    }
  },

  // ==================== FEATURE ACTIONS ====================

  fetchFeaturesByProduct: async (productId: string) => {
    set((state) => ({
      loading: { ...state.loading, features: true },
      errors: { ...state.errors, features: null },
    }));

    try {
      const features = await featureApi.listByProduct(productId);
      // Merge with existing features
      set((state) => ({
        features: [
          ...state.features.filter((f) => f.productId !== productId),
          ...features,
        ],
        loading: { ...state.loading, features: false },
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch features');
      set((state) => ({
        loading: { ...state.loading, features: false },
        errors: { ...state.errors, features: err },
      }));
      toast.error('Failed to load features');
    }
  },

  fetchFeature: async (id: string) => {
    const existing = get().features.find((f) => f.id === id);
    if (existing) return existing;

    set((state) => ({
      loading: { ...state.loading, features: true },
      errors: { ...state.errors, features: null },
    }));

    try {
      const feature = await featureApi.get(id);
      if (feature) {
        set((state) => ({
          features: [...state.features.filter((f) => f.id !== id), feature],
          loading: { ...state.loading, features: false },
        }));
      } else {
        set((state) => ({
          loading: { ...state.loading, features: false },
        }));
      }
      return feature;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch feature');
      set((state) => ({
        loading: { ...state.loading, features: false },
        errors: { ...state.errors, features: err },
      }));
      toast.error('Failed to load feature');
      return null;
    }
  },

  createFeature: async (data: CreateFeatureDto) => {
    set((state) => ({
      loading: { ...state.loading, features: true },
      errors: { ...state.errors, features: null },
    }));

    try {
      const feature = await featureApi.create(data);
      set((state) => ({
        features: [...state.features, feature],
        loading: { ...state.loading, features: false },
      }));
      toast.success('Feature created successfully');
      return feature;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create feature');
      set((state) => ({
        loading: { ...state.loading, features: false },
        errors: { ...state.errors, features: err },
      }));
      toast.error('Failed to create feature');
      throw error;
    }
  },

  updateFeature: async (id: string, updates: Partial<Feature>) => {
    set((state) => ({
      loading: { ...state.loading, features: true },
      errors: { ...state.errors, features: null },
    }));

    try {
      const updated = await featureApi.update(id, updates);
      if (updated) {
        set((state) => ({
          features: state.features.map((f) => (f.id === id ? updated : f)),
          loading: { ...state.loading, features: false },
        }));
        toast.success('Feature updated successfully');
      } else {
        throw new Error('Feature not found');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update feature');
      set((state) => ({
        loading: { ...state.loading, features: false },
        errors: { ...state.errors, features: err },
      }));
      toast.error('Failed to update feature');
      throw error;
    }
  },

  deleteFeature: async (id: string) => {
    set((state) => ({
      loading: { ...state.loading, features: true },
      errors: { ...state.errors, features: null },
    }));

    try {
      const changeIds = get().changes.filter((c) => c.featureId === id).map((c) => c.id);

      await featureApi.delete(id);

      set((state) => ({
        features: state.features.filter((f) => f.id !== id),
        changes: state.changes.filter((c) => c.featureId !== id),
        requirements: state.requirements.filter((r) => !changeIds.includes(r.changeId)),
        loading: { ...state.loading, features: false },
      }));

      for (const changeId of changeIds) {
        await changeApi.delete(changeId);
      }
      const requirementIds = get()
        .requirements.filter((r) => changeIds.includes(r.changeId))
        .map((r) => r.id);
      for (const reqId of requirementIds) {
        await requirementApi.delete(reqId);
      }

      toast.success('Feature deleted successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete feature');
      set((state) => ({
        loading: { ...state.loading, features: false },
        errors: { ...state.errors, features: err },
      }));
      toast.error('Failed to delete feature');
      throw error;
    }
  },

  // ==================== CHANGE ACTIONS ====================

  fetchChangesByFeature: async (featureId: string) => {
    set((state) => ({
      loading: { ...state.loading, changes: true },
      errors: { ...state.errors, changes: null },
    }));

    try {
      const changes = await changeApi.listByFeature(featureId);
      set((state) => ({
        changes: [
          ...state.changes.filter((c) => c.featureId !== featureId),
          ...changes,
        ],
        loading: { ...state.loading, changes: false },
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch changes');
      set((state) => ({
        loading: { ...state.loading, changes: false },
        errors: { ...state.errors, changes: err },
      }));
      toast.error('Failed to load changes');
    }
  },

  fetchChange: async (id: string) => {
    const existing = get().changes.find((c) => c.id === id);
    if (existing) return existing;

    set((state) => ({
      loading: { ...state.loading, changes: true },
      errors: { ...state.errors, changes: null },
    }));

    try {
      const change = await changeApi.get(id);
      if (change) {
        set((state) => ({
          changes: [...state.changes.filter((c) => c.id !== id), change],
          loading: { ...state.loading, changes: false },
        }));
      } else {
        set((state) => ({
          loading: { ...state.loading, changes: false },
        }));
      }
      return change;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch change');
      set((state) => ({
        loading: { ...state.loading, changes: false },
        errors: { ...state.errors, changes: err },
      }));
      toast.error('Failed to load change');
      return null;
    }
  },

  createChange: async (data: CreateChangeDto) => {
    set((state) => ({
      loading: { ...state.loading, changes: true },
      errors: { ...state.errors, changes: null },
    }));

    try {
      const change = await changeApi.create(data);
      set((state) => ({
        changes: [...state.changes, change],
        loading: { ...state.loading, changes: false },
      }));
      toast.success('Change created successfully');
      return change;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create change');
      set((state) => ({
        loading: { ...state.loading, changes: false },
        errors: { ...state.errors, changes: err },
      }));
      toast.error('Failed to create change');
      throw error;
    }
  },

  updateChange: async (id: string, updates: Partial<Change>) => {
    set((state) => ({
      loading: { ...state.loading, changes: true },
      errors: { ...state.errors, changes: null },
    }));

    try {
      const updated = await changeApi.update(id, updates);
      if (updated) {
        set((state) => ({
          changes: state.changes.map((c) => (c.id === id ? updated : c)),
          loading: { ...state.loading, changes: false },
        }));
        toast.success('Change updated successfully');
      } else {
        throw new Error('Change not found');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update change');
      set((state) => ({
        loading: { ...state.loading, changes: false },
        errors: { ...state.errors, changes: err },
      }));
      toast.error('Failed to update change');
      throw error;
    }
  },

  deleteChange: async (id: string) => {
    set((state) => ({
      loading: { ...state.loading, changes: true },
      errors: { ...state.errors, changes: null },
    }));

    try {
      await changeApi.delete(id);

      set((state) => ({
        changes: state.changes.filter((c) => c.id !== id),
        requirements: state.requirements.filter((r) => r.changeId !== id),
        loading: { ...state.loading, changes: false },
      }));

      const requirementIds = get()
        .requirements.filter((r) => r.changeId === id)
        .map((r) => r.id);
      for (const reqId of requirementIds) {
        await requirementApi.delete(reqId);
      }

      toast.success('Change deleted successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete change');
      set((state) => ({
        loading: { ...state.loading, changes: false },
        errors: { ...state.errors, changes: err },
      }));
      toast.error('Failed to delete change');
      throw error;
    }
  },

  // ==================== REQUIREMENT ACTIONS ====================

  fetchRequirementsByChange: async (changeId: string) => {
    set((state) => ({
      loading: { ...state.loading, requirements: true },
      errors: { ...state.errors, requirements: null },
    }));

    try {
      const requirements = await requirementApi.listByChange(changeId);
      set((state) => ({
        requirements: [
          ...state.requirements.filter((r) => r.changeId !== changeId),
          ...requirements,
        ],
        loading: { ...state.loading, requirements: false },
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch requirements');
      set((state) => ({
        loading: { ...state.loading, requirements: false },
        errors: { ...state.errors, requirements: err },
      }));
      toast.error('Failed to load requirements');
    }
  },

  fetchRequirement: async (id: string) => {
    const existing = get().requirements.find((r) => r.id === id);
    if (existing) return existing;

    set((state) => ({
      loading: { ...state.loading, requirements: true },
      errors: { ...state.errors, requirements: null },
    }));

    try {
      const requirement = await requirementApi.get(id);
      if (requirement) {
        set((state) => ({
          requirements: [...state.requirements.filter((r) => r.id !== id), requirement],
          loading: { ...state.loading, requirements: false },
        }));
      } else {
        set((state) => ({
          loading: { ...state.loading, requirements: false },
        }));
      }
      return requirement;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch requirement');
      set((state) => ({
        loading: { ...state.loading, requirements: false },
        errors: { ...state.errors, requirements: err },
      }));
      toast.error('Failed to load requirement');
      return null;
    }
  },

  createRequirement: async (data: CreateRequirementDto) => {
    set((state) => ({
      loading: { ...state.loading, requirements: true },
      errors: { ...state.errors, requirements: null },
    }));

    try {
      const requirement = await requirementApi.create(data);
      set((state) => ({
        requirements: [...state.requirements, requirement],
        loading: { ...state.loading, requirements: false },
      }));
      toast.success('Requirement created successfully');
      return requirement;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create requirement');
      set((state) => ({
        loading: { ...state.loading, requirements: false },
        errors: { ...state.errors, requirements: err },
      }));
      toast.error('Failed to create requirement');
      throw error;
    }
  },

  updateRequirement: async (id: string, updates: Partial<Requirement>) => {
    set((state) => ({
      loading: { ...state.loading, requirements: true },
      errors: { ...state.errors, requirements: null },
    }));

    try {
      const updated = await requirementApi.update(id, updates);
      if (updated) {
        set((state) => ({
          requirements: state.requirements.map((r) => (r.id === id ? updated : r)),
          loading: { ...state.loading, requirements: false },
        }));
        toast.success('Requirement updated successfully');
      } else {
        throw new Error('Requirement not found');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update requirement');
      set((state) => ({
        loading: { ...state.loading, requirements: false },
        errors: { ...state.errors, requirements: err },
      }));
      toast.error('Failed to update requirement');
      throw error;
    }
  },

  deleteRequirement: async (id: string) => {
    set((state) => ({
      loading: { ...state.loading, requirements: true },
      errors: { ...state.errors, requirements: null },
    }));

    try {
      await requirementApi.delete(id);

      set((state) => ({
        requirements: state.requirements.filter((r) => r.id !== id),
        loading: { ...state.loading, requirements: false },
      }));

      toast.success('Requirement deleted successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete requirement');
      set((state) => ({
        loading: { ...state.loading, requirements: false },
        errors: { ...state.errors, requirements: err },
      }));
      toast.error('Failed to delete requirement');
      throw error;
    }
  },

  // ==================== RELATIONSHIP QUERIES ====================

  getFeaturesByProductId: (productId: string) => {
    return get().features.filter((f) => f.productId === productId);
  },

  getChangesByFeatureId: (featureId: string) => {
    return get().changes.filter((c) => c.featureId === featureId);
  },

  getRequirementsByChangeId: (changeId: string) => {
    return get().requirements.filter((r) => r.changeId === changeId);
  },
}));

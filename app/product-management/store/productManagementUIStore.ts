/**
 * Product Management UI Store
 * Manages UI-specific state (selections, modals, editing state)
 */

import { create } from 'zustand';
import type { Product, Feature, Change, Requirement } from '~/core/entities/product-management';

interface ProductManagementUIStore {
  // Selection state
  selectedProductId: string | null;
  selectedFeatureId: string | null;
  selectedChangeId: string | null;

  // Modal states
  modals: {
    addProduct: boolean;
    editProduct: boolean;
    deleteProduct: boolean;
    addFeature: boolean;
    editFeature: boolean;
    deleteFeature: boolean;
    addChange: boolean;
    editChange: boolean;
    deleteChange: boolean;
    addRequirement: boolean;
    editRequirement: boolean;
    deleteRequirement: boolean;
  };

  // Editing state
  editingProduct: Product | null;
  editingFeature: Feature | null;
  editingChange: Change | null;
  editingRequirement: Requirement | null;

  // Selection actions
  setSelectedProductId: (id: string | null) => void;
  setSelectedFeatureId: (id: string | null) => void;
  setSelectedChangeId: (id: string | null) => void;

  // Modal actions
  openModal: (modalName: keyof ProductManagementUIStore['modals']) => void;
  closeModal: (modalName: keyof ProductManagementUIStore['modals']) => void;
  closeAllModals: () => void;

  // Editing actions
  setEditingProduct: (product: Product | null) => void;
  setEditingFeature: (feature: Feature | null) => void;
  setEditingChange: (change: Change | null) => void;
  setEditingRequirement: (requirement: Requirement | null) => void;
  clearAllEditing: () => void;
}

export const useProductManagementUIStore = create<ProductManagementUIStore>((set) => ({
  // Initial state
  selectedProductId: null,
  selectedFeatureId: null,
  selectedChangeId: null,

  modals: {
    addProduct: false,
    editProduct: false,
    deleteProduct: false,
    addFeature: false,
    editFeature: false,
    deleteFeature: false,
    addChange: false,
    editChange: false,
    deleteChange: false,
    addRequirement: false,
    editRequirement: false,
    deleteRequirement: false,
  },

  editingProduct: null,
  editingFeature: null,
  editingChange: null,
  editingRequirement: null,

  // Selection actions
  setSelectedProductId: (id) => set({ selectedProductId: id }),
  setSelectedFeatureId: (id) => set({ selectedFeatureId: id }),
  setSelectedChangeId: (id) => set({ selectedChangeId: id }),

  // Modal actions
  openModal: (modalName) =>
    set((state) => ({
      modals: { ...state.modals, [modalName]: true },
    })),

  closeModal: (modalName) =>
    set((state) => ({
      modals: { ...state.modals, [modalName]: false },
    })),

  closeAllModals: () =>
    set({
      modals: {
        addProduct: false,
        editProduct: false,
        deleteProduct: false,
        addFeature: false,
        editFeature: false,
        deleteFeature: false,
        addChange: false,
        editChange: false,
        deleteChange: false,
        addRequirement: false,
        editRequirement: false,
        deleteRequirement: false,
      },
    }),

  // Editing actions
  setEditingProduct: (product) => set({ editingProduct: product }),
  setEditingFeature: (feature) => set({ editingFeature: feature }),
  setEditingChange: (change) => set({ editingChange: change }),
  setEditingRequirement: (requirement) => set({ editingRequirement: requirement }),

  clearAllEditing: () =>
    set({
      editingProduct: null,
      editingFeature: null,
      editingChange: null,
      editingRequirement: null,
    }),
}));

/**
 * Solution Management UI Store
 * Manages UI-specific state (selections, modals, editing state)
 */

import { create } from 'zustand';
import type { Solution, Feature, Change, Requirement } from '~/core/entities/product-management';

interface SolutionManagementUIStore {
  // Selection state
  selectedSolutionId: string | null;
  selectedFeatureId: string | null;
  selectedChangeId: string | null;

  // Modal states
  modals: {
    addSolution: boolean;
    editSolution: boolean;
    deleteSolution: boolean;
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
  editingSolution: Solution | null;
  editingFeature: Feature | null;
  editingChange: Change | null;
  editingRequirement: Requirement | null;

  // Selection actions
  setSelectedSolutionId: (id: string | null) => void;
  setSelectedFeatureId: (id: string | null) => void;
  setSelectedChangeId: (id: string | null) => void;

  // Modal actions
  openModal: (modalName: keyof SolutionManagementUIStore['modals']) => void;
  closeModal: (modalName: keyof SolutionManagementUIStore['modals']) => void;
  closeAllModals: () => void;

  // Editing actions
  setEditingSolution: (solution: Solution | null) => void;
  setEditingFeature: (feature: Feature | null) => void;
  setEditingChange: (change: Change | null) => void;
  setEditingRequirement: (requirement: Requirement | null) => void;
  clearAllEditing: () => void;
}

export const useSolutionManagementUIStore = create<SolutionManagementUIStore>((set) => ({
  // Initial state
  selectedSolutionId: null,
  selectedFeatureId: null,
  selectedChangeId: null,

  modals: {
    addSolution: false,
    editSolution: false,
    deleteSolution: false,
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

  editingSolution: null,
  editingFeature: null,
  editingChange: null,
  editingRequirement: null,

  // Selection actions
  setSelectedSolutionId: (id) => set({ selectedSolutionId: id }),
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
        addSolution: false,
        editSolution: false,
        deleteSolution: false,
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
  setEditingSolution: (solution) => set({ editingSolution: solution }),
  setEditingFeature: (feature) => set({ editingFeature: feature }),
  setEditingChange: (change) => set({ editingChange: change }),
  setEditingRequirement: (requirement) => set({ editingRequirement: requirement }),

  clearAllEditing: () =>
    set({
      editingSolution: null,
      editingFeature: null,
      editingChange: null,
      editingRequirement: null,
    }),
}));

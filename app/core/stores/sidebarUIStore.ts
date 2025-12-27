/**
 * Sidebar UI Store
 * Manages GlobalSidebar collapse state and flyout visibility
 */

import { create } from 'zustand';

interface SidebarUIStore {
  // State
  isCollapsed: boolean;
  flyoutSection: string | null; // null = no flyout, 'scope' | 'design' | 'plan'

  // Actions
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  setFlyoutSection: (section: string | null) => void;
  autoCollapseForDesignStudio: () => void;
  resetCollapseState: () => void;
}

export const useSidebarUIStore = create<SidebarUIStore>((set) => ({
  isCollapsed: false,
  flyoutSection: null,

  setCollapsed: (collapsed) => set({ isCollapsed: collapsed, flyoutSection: null }),

  toggleCollapsed: () =>
    set((state) => ({
      isCollapsed: !state.isCollapsed,
      flyoutSection: null,
    })),

  setFlyoutSection: (section) => set({ flyoutSection: section }),

  autoCollapseForDesignStudio: () => set({ isCollapsed: true, flyoutSection: null }),

  resetCollapseState: () => set({ isCollapsed: false, flyoutSection: null }),
}));

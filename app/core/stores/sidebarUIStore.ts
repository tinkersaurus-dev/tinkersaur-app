/**
 * Sidebar UI Store
 * Manages GlobalSidebar collapse state and flyout visibility
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarUIStore {
  // State
  isCollapsed: boolean;
  flyoutSection: string | null; // null = no flyout, 'scope' | 'design' | 'plan'

  // Actions
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  setFlyoutSection: (section: string | null) => void;
  resetCollapseState: () => void;
}

export const useSidebarUIStore = create<SidebarUIStore>()(
  persist(
    (set) => ({
      isCollapsed: true,
      flyoutSection: null,

      setCollapsed: (collapsed) => set({ isCollapsed: collapsed, flyoutSection: null }),

      toggleCollapsed: () =>
        set((state) => ({
          isCollapsed: !state.isCollapsed,
          flyoutSection: null,
        })),

      setFlyoutSection: (section) => set({ flyoutSection: section }),

      resetCollapseState: () => set({ isCollapsed: true, flyoutSection: null }),
    }),
    {
      name: 'sidebar-ui-state',
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    }
  )
);

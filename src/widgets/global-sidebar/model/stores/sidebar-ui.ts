/**
 * Sidebar UI Store
 * Manages GlobalSidebar collapse state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarUIStore {
  // State
  isCollapsed: boolean;

  // Actions
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  resetCollapseState: () => void;
}

export const useSidebarUIStore = create<SidebarUIStore>()(
  persist(
    (set) => ({
      isCollapsed: true,

      setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),

      toggleCollapsed: () =>
        set((state) => ({
          isCollapsed: !state.isCollapsed,
        })),

      resetCollapseState: () => set({ isCollapsed: true }),
    }),
    {
      name: 'sidebar-ui-state',
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    }
  )
);

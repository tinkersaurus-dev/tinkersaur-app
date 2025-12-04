import { create } from 'zustand';

/**
 * State for overlay visibility management
 */
interface OverlayVisibilityState {
  // Map of overlayTag -> isVisible
  visibleOverlays: Record<string, boolean>;
}

/**
 * Actions for overlay visibility management
 */
interface OverlayVisibilityActions {
  // Set visibility for a specific overlay tag
  setOverlayVisible: (tag: string, visible: boolean) => void;
  // Toggle visibility for a specific overlay tag
  toggleOverlay: (tag: string) => void;
  // Initialize overlays as hidden (used on diagram load)
  initializeOverlays: (tags: string[]) => void;
  // Show a specific overlay (used when creating new overlay elements)
  showOverlay: (tag: string) => void;
  // Clear all overlay visibility state
  clear: () => void;
}

/**
 * Combined store type
 */
type OverlayVisibilityStore = OverlayVisibilityState & OverlayVisibilityActions;

/**
 * Global Zustand store for overlay visibility state
 *
 * Overlays are tagged groups of shapes/connectors that can be shown or hidden.
 * By default, all overlays are hidden when a diagram loads.
 * When new overlay elements are created (e.g., suggestions), the overlay is shown.
 */
export const useOverlayVisibilityStore = create<OverlayVisibilityStore>((set) => ({
  // State
  visibleOverlays: {},

  // Actions
  setOverlayVisible: (tag: string, visible: boolean) =>
    set((state) => ({
      visibleOverlays: {
        ...state.visibleOverlays,
        [tag]: visible,
      },
    })),

  toggleOverlay: (tag: string) =>
    set((state) => ({
      visibleOverlays: {
        ...state.visibleOverlays,
        [tag]: !state.visibleOverlays[tag],
      },
    })),

  initializeOverlays: (tags: string[]) =>
    set(() => {
      const visibility: Record<string, boolean> = {};
      for (const tag of tags) {
        visibility[tag] = false; // All hidden by default on load
      }
      return { visibleOverlays: visibility };
    }),

  showOverlay: (tag: string) =>
    set((state) => ({
      visibleOverlays: {
        ...state.visibleOverlays,
        [tag]: true,
      },
    })),

  clear: () => set({ visibleOverlays: {} }),
}));

/**
 * Helper function to check if a shape/connector should be visible
 * based on its overlayTag and current visibility settings
 */
export function isOverlayElementVisible(
  overlayTag: string | undefined,
  visibleOverlays: Record<string, boolean>
): boolean {
  // If no overlay tag, always visible
  if (!overlayTag) {
    return true;
  }
  // If overlay tag exists, check visibility (default to false if not in map)
  return visibleOverlays[overlayTag] ?? false;
}

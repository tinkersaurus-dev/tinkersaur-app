import { create } from 'zustand';

/**
 * State for the mermaid viewer
 */
interface MermaidViewerState {
  isOpen: boolean;
  mermaidSyntax: string;
  errorMessage: string | null;
}

/**
 * Actions for the mermaid viewer
 */
interface MermaidViewerActions {
  toggleOpen: () => void;
  setOpen: (isOpen: boolean) => void;
  setSyntax: (syntax: string) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

/**
 * Combined store type
 */
type MermaidViewerStore = MermaidViewerState & MermaidViewerActions;

/**
 * Global Zustand store for mermaid viewer state
 * This is a singleton store used across all diagram instances
 */
export const useMermaidViewerStore = create<MermaidViewerStore>((set) => ({
  // State
  isOpen: false,
  mermaidSyntax: '',
  errorMessage: null,

  // Actions
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

  setOpen: (isOpen: boolean) => set({ isOpen }),

  setSyntax: (syntax: string) =>
    set({
      mermaidSyntax: syntax,
      errorMessage: null, // Clear error when setting new syntax
    }),

  setError: (error: string | null) =>
    set({
      errorMessage: error,
      mermaidSyntax: error ? '' : undefined, // Clear syntax on error
    }),

  clear: () =>
    set({
      mermaidSyntax: '',
      errorMessage: null,
    }),
}));

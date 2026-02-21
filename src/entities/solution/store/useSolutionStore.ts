import { create } from 'zustand';
import type { Solution } from '../model/types';

const SELECTED_SOLUTION_KEY = 'tinkersaur_selected_solution';

interface SelectedSolution {
  solutionId: string;
  solutionName: string;
}

interface SolutionState {
  selectedSolution: SelectedSolution | null;
  initialized: boolean;
  selectSolution: (solution: Solution | SelectedSolution) => void;
  clearSolution: () => void;
  initialize: () => void;
}

// Initialize from localStorage synchronously to prevent flicker on page refresh
function getInitialState(): { selectedSolution: SelectedSolution | null; initialized: boolean } {
  if (typeof localStorage === 'undefined') {
    return { selectedSolution: null, initialized: false };
  }

  const stored = localStorage.getItem(SELECTED_SOLUTION_KEY);
  if (stored) {
    try {
      const selectedSolution = JSON.parse(stored) as SelectedSolution;
      return { selectedSolution, initialized: true };
    } catch {
      localStorage.removeItem(SELECTED_SOLUTION_KEY);
    }
  }
  return { selectedSolution: null, initialized: true };
}

const initialState = getInitialState();

export const useSolutionStore = create<SolutionState>((set) => ({
  selectedSolution: initialState.selectedSolution,
  initialized: initialState.initialized,

  selectSolution: (solution) => {
    const selectedSolution: SelectedSolution = {
      solutionId: 'id' in solution ? solution.id : solution.solutionId,
      solutionName: 'name' in solution ? solution.name : solution.solutionName,
    };

    localStorage.setItem(SELECTED_SOLUTION_KEY, JSON.stringify(selectedSolution));
    set({ selectedSolution });
  },

  clearSolution: () => {
    localStorage.removeItem(SELECTED_SOLUTION_KEY);
    set({ selectedSolution: null });
  },

  initialize: () => {
    const stored = localStorage.getItem(SELECTED_SOLUTION_KEY);

    if (stored) {
      try {
        const selectedSolution = JSON.parse(stored) as SelectedSolution;
        set({ selectedSolution, initialized: true });
        return;
      } catch {
        localStorage.removeItem(SELECTED_SOLUTION_KEY);
      }
    }

    set({ initialized: true });
  },
}));

// Helper to get selected solution ID from localStorage (for use in loaders)
export function getSelectedSolutionId(): string | null {
  if (typeof localStorage === 'undefined') return null;

  const stored = localStorage.getItem(SELECTED_SOLUTION_KEY);
  if (!stored) return null;

  try {
    const selectedSolution = JSON.parse(stored) as SelectedSolution;
    return selectedSolution.solutionId;
  } catch {
    return null;
  }
}

import { create } from 'zustand';
import { commandManager } from '~/core/commands/CommandManager';
import type { CommandScope } from '~/core/commands/command.types';

/**
 * Command store state interface
 */
interface CommandStoreState {
  // Actions
  undo: (scope: CommandScope) => Promise<void>;
  redo: (scope: CommandScope) => Promise<void>;
  canUndo: (scope: CommandScope) => boolean;
  canRedo: (scope: CommandScope) => boolean;
  getUndoDescription: (scope: CommandScope) => string | undefined;
  getRedoDescription: (scope: CommandScope) => string | undefined;
  clearScope: (scope: CommandScope) => void;
}

/**
 * Command store - manages UI state for command system
 * Works in conjunction with the global CommandManager
 */
export const useCommandStore = create<CommandStoreState>((set) => ({
  undo: async (scope: CommandScope) => {
    await commandManager.undo(scope);
    // Trigger re-render by updating state
    set({});
  },

  redo: async (scope: CommandScope) => {
    await commandManager.redo(scope);
    // Trigger re-render by updating state
    set({});
  },

  canUndo: (scope: CommandScope) => {
    return commandManager.canUndo(scope);
  },

  canRedo: (scope: CommandScope) => {
    return commandManager.canRedo(scope);
  },

  getUndoDescription: (scope: CommandScope) => {
    return commandManager.getUndoDescription(scope);
  },

  getRedoDescription: (scope: CommandScope) => {
    return commandManager.getRedoDescription(scope);
  },

  clearScope: (scope: CommandScope) => {
    commandManager.clearScope(scope);
    // Trigger re-render by updating state
    set({});
  },
}));

// Core types and interfaces
export type { Command, CommandScope, CommandHistoryOptions } from './command.types';

// Command history management
export { CommandHistory } from './CommandHistory';

// Scoped command manager + singleton
export { CommandManager, commandManager } from './CommandManager';

// Zustand store for UI state
export { useCommandStore } from './useCommandStore';

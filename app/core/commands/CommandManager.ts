import { CommandHistory } from './CommandHistory';
import type { Command, CommandScope, CommandHistoryOptions } from './command.types';

/**
 * Manages multiple command histories with scope-based isolation
 * Each scope (e.g., diagram ID) gets its own independent undo/redo history
 */
export class CommandManager {
  private histories: Map<CommandScope, CommandHistory> = new Map();
  private readonly defaultOptions: CommandHistoryOptions;

  constructor(options: CommandHistoryOptions = {}) {
    this.defaultOptions = options;
  }

  /**
   * Get or create a command history for a given scope
   */
  private getHistory(scope: CommandScope): CommandHistory {
    let history = this.histories.get(scope);
    if (!history) {
      history = new CommandHistory(this.defaultOptions);
      this.histories.set(scope, history);
    }
    return history;
  }

  /**
   * Execute a command in a specific scope
   */
  async execute(command: Command, scope: CommandScope = 'global'): Promise<void> {
    const history = this.getHistory(scope);
    await history.execute(command);
  }

  /**
   * Undo the most recent command in a specific scope
   */
  async undo(scope: CommandScope = 'global'): Promise<void> {
    const history = this.getHistory(scope);
    await history.undo();
  }

  /**
   * Redo the most recently undone command in a specific scope
   */
  async redo(scope: CommandScope = 'global'): Promise<void> {
    const history = this.getHistory(scope);
    await history.redo();
  }

  /**
   * Check if there are commands that can be undone in a specific scope
   */
  canUndo(scope: CommandScope = 'global'): boolean {
    const history = this.histories.get(scope);
    return history?.canUndo() ?? false;
  }

  /**
   * Check if there are commands that can be redone in a specific scope
   */
  canRedo(scope: CommandScope = 'global'): boolean {
    const history = this.histories.get(scope);
    return history?.canRedo() ?? false;
  }

  /**
   * Get description of the next command to undo in a specific scope
   */
  getUndoDescription(scope: CommandScope = 'global'): string | undefined {
    const history = this.histories.get(scope);
    return history?.getUndoDescription();
  }

  /**
   * Get description of the next command to redo in a specific scope
   */
  getRedoDescription(scope: CommandScope = 'global'): string | undefined {
    const history = this.histories.get(scope);
    return history?.getRedoDescription();
  }

  /**
   * Clear command history for a specific scope
   */
  clearScope(scope: CommandScope): void {
    const history = this.histories.get(scope);
    if (history) {
      history.clear();
      this.histories.delete(scope);
    }
  }

  /**
   * Clear all command histories across all scopes
   */
  clearAll(): void {
    this.histories.forEach(history => history.clear());
    this.histories.clear();
  }

  /**
   * Get all active scopes
   */
  getActiveScopes(): CommandScope[] {
    return Array.from(this.histories.keys());
  }

  /**
   * Get the undo stack size for a specific scope
   */
  getUndoStackSize(scope: CommandScope = 'global'): number {
    const history = this.histories.get(scope);
    return history?.getUndoStackSize() ?? 0;
  }

  /**
   * Get the redo stack size for a specific scope
   */
  getRedoStackSize(scope: CommandScope = 'global'): number {
    const history = this.histories.get(scope);
    return history?.getRedoStackSize() ?? 0;
  }

  /**
   * Check if a scope exists and has history
   */
  hasScope(scope: CommandScope): boolean {
    return this.histories.has(scope);
  }
}

/**
 * Global singleton instance of CommandManager
 */
export const commandManager = new CommandManager({ maxHistorySize: 50 });

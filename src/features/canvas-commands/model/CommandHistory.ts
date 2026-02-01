import type { Command, CommandHistoryOptions } from './command.types';

/**
 * Manages a stack of executed commands for undo/redo functionality
 */
export class CommandHistory {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private readonly maxHistorySize: number;

  constructor(options: CommandHistoryOptions = {}) {
    this.maxHistorySize = options.maxHistorySize ?? 50;
  }

  /**
   * Execute a command and add it to the undo stack
   */
  async execute(command: Command): Promise<void> {
    await command.execute();

    // Add to undo stack
    this.undoStack.push(command);

    // Clear redo stack when a new command is executed
    this.redoStack = [];

    // Enforce max history size
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
  }

  /**
   * Undo the most recent command
   */
  async undo(): Promise<void> {
    const command = this.undoStack.pop();
    if (!command) {
      console.warn('Nothing to undo');
      return;
    }

    await command.undo();
    this.redoStack.push(command);
  }

  /**
   * Redo the most recently undone command
   */
  async redo(): Promise<void> {
    const command = this.redoStack.pop();
    if (!command) {
      console.warn('Nothing to redo');
      return;
    }

    await command.execute();
    this.undoStack.push(command);
  }

  /**
   * Check if there are commands that can be undone
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if there are commands that can be redone
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Get description of the next command to undo
   */
  getUndoDescription(): string | undefined {
    const command = this.undoStack[this.undoStack.length - 1];
    return command?.description;
  }

  /**
   * Get description of the next command to redo
   */
  getRedoDescription(): string | undefined {
    const command = this.redoStack[this.redoStack.length - 1];
    return command?.description;
  }

  /**
   * Get the complete undo history (for debugging or UI display)
   */
  getUndoHistory(): Command[] {
    return [...this.undoStack];
  }

  /**
   * Get the complete redo history (for debugging or UI display)
   */
  getRedoHistory(): Command[] {
    return [...this.redoStack];
  }

  /**
   * Clear all command history
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Get the current size of the undo stack
   */
  getUndoStackSize(): number {
    return this.undoStack.length;
  }

  /**
   * Get the current size of the redo stack
   */
  getRedoStackSize(): number {
    return this.redoStack.length;
  }
}

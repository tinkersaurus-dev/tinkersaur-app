/**
 * Core command pattern interfaces for undo/redo functionality
 */

/**
 * Base interface for all commands
 * Commands encapsulate operations that can be executed and undone
 */
export interface Command {
  /**
   * Execute the command, applying changes to the system
   */
  execute(): Promise<void>;

  /**
   * Undo the command, reversing the changes made by execute()
   */
  undo(): Promise<void>;

  /**
   * Optional description of the command for UI display
   */
  description?: string;
}

/**
 * Options for CommandHistory configuration
 */
export interface CommandHistoryOptions {
  /**
   * Maximum number of commands to keep in history
   * @default 50
   */
  maxHistorySize?: number;
}

/**
 * Represents a scope for command execution (e.g., a specific diagram or global)
 */
export type CommandScope = string | 'global';

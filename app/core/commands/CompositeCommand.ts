import type { Command } from './command.types';

/**
 * A command that groups multiple commands together
 * Useful for operations that affect multiple entities or require multiple steps
 */
export class CompositeCommand implements Command {
  public readonly description: string;

  constructor(
    private readonly commands: Command[],
    description?: string
  ) {
    this.description = description ?? this.generateDescription();
  }

  /**
   * Execute all commands in order
   */
  async execute(): Promise<void> {
    for (const command of this.commands) {
      await command.execute();
    }
  }

  /**
   * Undo all commands in reverse order
   */
  async undo(): Promise<void> {
    // Undo in reverse order to properly restore state
    for (let i = this.commands.length - 1; i >= 0; i--) {
      await this.commands[i].undo();
    }
  }

  /**
   * Generate a default description based on the number of commands
   */
  private generateDescription(): string {
    if (this.commands.length === 0) {
      return 'Empty operation';
    }
    if (this.commands.length === 1) {
      return this.commands[0].description ?? 'Operation';
    }
    return `${this.commands.length} operations`;
  }

  /**
   * Get the individual commands in this composite
   */
  getCommands(): Command[] {
    return [...this.commands];
  }

  /**
   * Get the number of commands in this composite
   */
  getCommandCount(): number {
    return this.commands.length;
  }
}

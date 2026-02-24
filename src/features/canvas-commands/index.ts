/**
 * Canvas Commands Feature
 *
 * This module provides a complete undo/redo command system implementation
 * based on the Command Pattern for canvas operations.
 */

// Core types and interfaces
export type { Command, CommandScope, CommandHistoryOptions } from './model/command.types';

// Command management
export { CommandHistory } from './model/CommandHistory';
export { CommandManager, commandManager } from './model/CommandManager';

// Command store (UI state for undo/redo)
export { useCommandStore } from './model/useCommandStore';

// Canvas commands - Shapes
export { AddShapeCommand } from './commands/shapes/AddShapeCommand';
export { DeleteShapeCommand } from './commands/shapes/DeleteShapeCommand';
export { MoveShapeCommand } from './commands/shapes/MoveShapeCommand';
export { UpdateShapeLabelCommand } from './commands/shapes/UpdateShapeLabelCommand';

// Canvas commands - Connectors
export { UpdateConnectorLabelCommand } from './commands/connectors/UpdateConnectorLabelCommand';

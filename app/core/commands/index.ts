/**
 * Command System Exports
 *
 * This module provides a complete undo/redo command system implementation
 * based on the Command Pattern.
 */

// Core types and interfaces
export type { Command, CommandScope, CommandHistoryOptions } from './command.types';

// Command management
export { CommandHistory } from './CommandHistory';
export { CommandManager, commandManager } from './CommandManager';

// Canvas commands
export { AddShapeCommand } from './canvas/shapes/AddShapeCommand';
export { DeleteShapeCommand } from './canvas/shapes/DeleteShapeCommand';
export { MoveShapeCommand } from './canvas/shapes/MoveShapeCommand';
export { UpdateShapeLabelCommand } from './canvas/shapes/UpdateShapeLabelCommand';
export { UpdateConnectorLabelCommand } from './canvas/connectors/UpdateConnectorLabelCommand';

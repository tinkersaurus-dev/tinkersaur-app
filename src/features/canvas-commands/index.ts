/**
 * Canvas Commands Feature
 *
 * This module provides a complete undo/redo command system implementation
 * based on the Command Pattern for canvas operations.
 */

// Core types and interfaces (re-exported from shared)
export type { Command, CommandScope, CommandHistoryOptions } from '@/shared/model/commands';

// Command management (re-exported from shared)
export { CommandHistory } from '@/shared/model/commands';
export { CommandManager, commandManager } from '@/shared/model/commands';

// Command store (re-exported from shared)
export { useCommandStore } from '@/shared/model/commands';

// Canvas commands - Shapes
export { AddShapeCommand } from './commands/shapes/AddShapeCommand';
export { DeleteShapeCommand } from './commands/shapes/DeleteShapeCommand';
export { MoveShapeCommand } from './commands/shapes/MoveShapeCommand';
export { UpdateShapeLabelCommand } from './commands/shapes/UpdateShapeLabelCommand';

// Canvas commands - Connectors
export { UpdateConnectorLabelCommand } from './commands/connectors/UpdateConnectorLabelCommand';

// Canvas commands - Sequence
export { UpdateLifelineActivationsCommand } from './commands/sequence/UpdateLifelineActivationsCommand';
export { UpdateLifelineHeightsCommand } from './commands/sequence/UpdateLifelineHeightsCommand';
export { RefreshSequenceActivationsCommand } from './commands/sequence/RefreshSequenceActivationsCommand';

// Canvas commands - Entity Relationship
export { AddEntityAttributeCommand } from './commands/entity-relationship/AddEntityAttributeCommand';
export { DeleteEntityAttributeCommand } from './commands/entity-relationship/DeleteEntityAttributeCommand';
export { UpdateEntityAttributeCommand } from './commands/entity-relationship/UpdateEntityAttributeCommand';

import type { Command } from './command.types';
import type { CreateShapeDTO, Shape } from '../entities/design-studio/types/Shape';
import type { CreateConnectorDTO, Connector, UpdateConnectorDTO } from '../entities/design-studio/types/Connector';
import type { Diagram } from '../entities/design-studio/types';
import { AddShapeCommand } from './canvas/AddShapeCommand';
import { DeleteShapeCommand } from './canvas/DeleteShapeCommand';
import { UpdateShapeLabelCommand } from './canvas/UpdateShapeLabelCommand';
import { UpdateShapeDataCommand } from './canvas/UpdateShapeDataCommand';
import { MoveShapeCommand } from './canvas/MoveShapeCommand';
import { MoveEntitiesCommand } from './canvas/MoveEntitiesCommand';
import { AddConnectorCommand } from './canvas/AddConnectorCommand';
import { DeleteConnectorCommand } from './canvas/DeleteConnectorCommand';
import { UpdateConnectorLabelCommand } from './canvas/UpdateConnectorLabelCommand';
import { ChangeConnectorTypeCommand } from './canvas/ChangeConnectorTypeCommand';
import { AddClassAttributeCommand } from './canvas/AddClassAttributeCommand';
import { AddClassMethodCommand } from './canvas/AddClassMethodCommand';
import { UpdateClassAttributeCommand } from './canvas/UpdateClassAttributeCommand';
import { UpdateClassMethodCommand } from './canvas/UpdateClassMethodCommand';
import { DeleteClassAttributeCommand } from './canvas/DeleteClassAttributeCommand';
import { DeleteClassMethodCommand } from './canvas/DeleteClassMethodCommand';
import { BatchDeleteShapesCommand } from './canvas/BatchDeleteShapesCommand';
import { BatchDeleteConnectorsCommand } from './canvas/BatchDeleteConnectorsCommand';
import { UpdateLifelineActivationsCommand } from './canvas/UpdateLifelineActivationsCommand';
import { RefreshSequenceActivationsCommand } from './canvas/RefreshSequenceActivationsCommand';
import type { ActivationBox } from '../entities/design-studio/types/Shape';

/**
 * Command Factory - Centralized command creation with dependency injection
 *
 * Benefits:
 * - Reduces coupling between command consumers and command implementation
 * - Single source of truth for command dependencies
 * - Easier testing through factory mocking
 * - Simplified API for command creation
 * - Enables adding cross-cutting concerns (logging, validation, etc.)
 */
export interface CommandFactoryDependencies {
  // Shape functions
  _internalAddShape: (diagramId: string, shape: CreateShapeDTO) => Promise<Diagram>;
  _internalDeleteShape: (diagramId: string, shapeId: string) => Promise<Diagram | null>;
  _internalUpdateShape: (diagramId: string, shapeId: string, updates: Partial<Shape>) => Promise<Diagram | null>;
  _internalUpdateShapes: (diagramId: string, updates: Array<{ shapeId: string; updates: Partial<Shape> }>) => Promise<Diagram | null>;
  _internalRestoreShape: (diagramId: string, shape: Shape) => Promise<Diagram>;
  _internalGetShape: (diagramId: string, shapeId: string) => Promise<Shape | null>;

  // Connector functions
  _internalAddConnector: (diagramId: string, connector: CreateConnectorDTO) => Promise<Diagram | null>;
  _internalDeleteConnector: (diagramId: string, connectorId: string) => Promise<Diagram | null>;
  _internalUpdateConnector: (diagramId: string, connectorId: string, updates: Partial<Connector>) => Promise<Diagram | null>;
  _internalRestoreConnector: (diagramId: string, connector: Connector) => Promise<Diagram | null>;
  _internalGetConnector: (diagramId: string, connectorId: string) => Promise<Connector | null>;

  // Batch operations
  _internalDeleteConnectorsBatch: (diagramId: string, connectorIds: string[]) => Promise<Diagram | null>;
  _internalRestoreConnectorsBatch: (diagramId: string, connectors: Connector[]) => Promise<Diagram | null>;
  _internalDeleteShapesBatch: (diagramId: string, shapeIds: string[]) => Promise<Diagram | null>;
  _internalRestoreShapesBatch: (diagramId: string, shapes: Shape[]) => Promise<Diagram | null>;

  // Diagram access
  getDiagram: (diagramId: string) => Diagram | null;

  // Local state update functions (optional)
  getUpdateLocalShape?: (diagramId: string) => ((shapeId: string, updates: Partial<Shape>) => void) | undefined;
  getUpdateLocalConnector?: (diagramId: string) => ((connectorId: string, updates: Partial<Connector>) => void) | undefined;
  getShape?: (shapeId: string) => Shape | undefined;
  getCurrentConnector?: (diagramId: string, connectorId: string) => Connector | null;
}

export class CommandFactory {
  constructor(private deps: CommandFactoryDependencies) {}

  // ============================================================================
  // Shape Commands
  // ============================================================================

  createAddShape(diagramId: string, shapeData: CreateShapeDTO): Command {
    return new AddShapeCommand(
      diagramId,
      shapeData,
      this.deps._internalAddShape,
      this.deps._internalDeleteShape
    );
  }

  createDeleteShape(diagramId: string, shapeId: string): Command {
    return new DeleteShapeCommand(
      diagramId,
      shapeId,
      this.deps._internalGetShape,
      this.deps._internalDeleteShape,
      this.deps._internalRestoreShape,
      this.deps.getDiagram,
      this.deps._internalDeleteConnectorsBatch,
      this.deps._internalRestoreConnectorsBatch
    );
  }

  createUpdateShapeLabel(
    diagramId: string,
    shapeId: string,
    oldLabel: string | undefined,
    newLabel: string | undefined
  ): Command {
    const updateLocalShape = this.deps.getUpdateLocalShape?.(diagramId);
    return new UpdateShapeLabelCommand(
      diagramId,
      shapeId,
      oldLabel,
      newLabel,
      this.deps._internalUpdateShape,
      updateLocalShape
    );
  }

  createUpdateShapeData(
    diagramId: string,
    shapeId: string,
    oldData: Record<string, unknown> | undefined,
    newData: Record<string, unknown> | undefined
  ): Command {
    const updateLocalShape = this.deps.getUpdateLocalShape?.(diagramId);
    return new UpdateShapeDataCommand(
      diagramId,
      shapeId,
      oldData,
      newData,
      this.deps._internalUpdateShape,
      updateLocalShape
    );
  }

  createMoveShape(
    diagramId: string,
    shapeId: string,
    fromPosition: { x: number; y: number },
    toPosition: { x: number; y: number }
  ): Command {
    const updateLocalShape = this.deps.getUpdateLocalShape?.(diagramId);
    return new MoveShapeCommand(
      diagramId,
      shapeId,
      fromPosition,
      toPosition,
      this.deps._internalUpdateShape,
      updateLocalShape
    );
  }

  createMoveEntities(
    diagramId: string,
    moves: Array<{
      shapeId: string;
      fromPosition: { x: number; y: number };
      toPosition: { x: number; y: number };
    }>
  ): Command {
    const updateLocalShape = this.deps.getUpdateLocalShape?.(diagramId);
    return new MoveEntitiesCommand(
      diagramId,
      moves,
      this.deps._internalUpdateShapes,
      updateLocalShape
    );
  }

  // ============================================================================
  // Connector Commands
  // ============================================================================

  createAddConnector(diagramId: string, connectorData: CreateConnectorDTO): Command {
    return new AddConnectorCommand(
      diagramId,
      connectorData,
      this.deps._internalAddConnector,
      this.deps._internalDeleteConnector
    );
  }

  createDeleteConnector(diagramId: string, connectorId: string): Command {
    return new DeleteConnectorCommand(
      diagramId,
      connectorId,
      this.deps._internalGetConnector,
      this.deps._internalDeleteConnector,
      this.deps._internalRestoreConnector
    );
  }

  createUpdateConnectorLabel(
    diagramId: string,
    connectorId: string,
    oldLabel: string | undefined,
    newLabel: string | undefined
  ): Command {
    const updateLocalConnector = this.deps.getUpdateLocalConnector?.(diagramId);
    return new UpdateConnectorLabelCommand(
      diagramId,
      connectorId,
      oldLabel,
      newLabel,
      this.deps._internalUpdateConnector,
      updateLocalConnector
    );
  }

  createChangeConnectorType(
    diagramId: string,
    connectorId: string,
    newConnectorData: UpdateConnectorDTO
  ): Command {
    const updateLocalConnector = this.deps.getUpdateLocalConnector?.(diagramId);
    return new ChangeConnectorTypeCommand(
      diagramId,
      connectorId,
      newConnectorData,
      this.deps._internalUpdateConnector,
      this.deps.getCurrentConnector || (() => null),
      updateLocalConnector
    );
  }

  // ============================================================================
  // Class Diagram Commands
  // ============================================================================

  createAddClassAttribute(
    diagramId: string,
    shapeId: string,
    attribute: string,
    getShapeFn: (shapeId: string) => Shape | undefined
  ): Command {
    const updateLocalShape = this.deps.getUpdateLocalShape?.(diagramId);
    return new AddClassAttributeCommand(
      diagramId,
      shapeId,
      attribute,
      this.deps._internalUpdateShape,
      getShapeFn,
      updateLocalShape
    );
  }

  createDeleteClassAttribute(
    diagramId: string,
    shapeId: string,
    attributeIndex: number,
    getShapeFn: (shapeId: string) => Shape | undefined
  ): Command {
    const updateLocalShape = this.deps.getUpdateLocalShape?.(diagramId);
    return new DeleteClassAttributeCommand(
      diagramId,
      shapeId,
      attributeIndex,
      this.deps._internalUpdateShape,
      getShapeFn,
      updateLocalShape
    );
  }

  createUpdateClassAttribute(
    diagramId: string,
    shapeId: string,
    attributeIndex: number,
    oldValue: string,
    newValue: string,
    getShapeFn: (shapeId: string) => Shape | undefined
  ): Command {
    const updateLocalShape = this.deps.getUpdateLocalShape?.(diagramId);
    return new UpdateClassAttributeCommand(
      diagramId,
      shapeId,
      attributeIndex,
      oldValue,
      newValue,
      this.deps._internalUpdateShape,
      getShapeFn,
      updateLocalShape
    );
  }

  createAddClassMethod(
    diagramId: string,
    shapeId: string,
    method: string,
    getShapeFn: (shapeId: string) => Shape | undefined
  ): Command {
    const updateLocalShape = this.deps.getUpdateLocalShape?.(diagramId);
    return new AddClassMethodCommand(
      diagramId,
      shapeId,
      method,
      this.deps._internalUpdateShape,
      getShapeFn,
      updateLocalShape
    );
  }

  createDeleteClassMethod(
    diagramId: string,
    shapeId: string,
    methodIndex: number,
    getShapeFn: (shapeId: string) => Shape | undefined
  ): Command {
    const updateLocalShape = this.deps.getUpdateLocalShape?.(diagramId);
    return new DeleteClassMethodCommand(
      diagramId,
      shapeId,
      methodIndex,
      this.deps._internalUpdateShape,
      getShapeFn,
      updateLocalShape
    );
  }

  createUpdateClassMethod(
    diagramId: string,
    shapeId: string,
    methodIndex: number,
    oldValue: string,
    newValue: string,
    getShapeFn: (shapeId: string) => Shape | undefined
  ): Command {
    const updateLocalShape = this.deps.getUpdateLocalShape?.(diagramId);
    return new UpdateClassMethodCommand(
      diagramId,
      shapeId,
      methodIndex,
      oldValue,
      newValue,
      this.deps._internalUpdateShape,
      getShapeFn,
      updateLocalShape
    );
  }

  // ============================================================================
  // Batch Operations
  // ============================================================================

  /**
   * Create an atomic batch delete command for multiple shapes
   * All shapes and their connected connectors are deleted as a single operation
   */
  createBatchDeleteShapes(diagramId: string, shapeIds: string[]): Command {
    return new BatchDeleteShapesCommand(
      diagramId,
      shapeIds,
      this.deps._internalGetShape,
      this.deps._internalDeleteShapesBatch,
      this.deps._internalRestoreShapesBatch,
      this.deps.getDiagram,
      this.deps._internalDeleteConnectorsBatch,
      this.deps._internalRestoreConnectorsBatch
    );
  }

  /**
   * Create an atomic batch delete command for multiple connectors
   * All connectors are deleted as a single operation
   */
  createBatchDeleteConnectors(diagramId: string, connectorIds: string[]): Command {
    return new BatchDeleteConnectorsCommand(
      diagramId,
      connectorIds,
      this.deps._internalGetConnector,
      this.deps._internalDeleteConnectorsBatch,
      this.deps._internalRestoreConnectorsBatch
    );
  }

  // ============================================================================
  // Sequence Diagram Commands
  // ============================================================================

  /**
   * Update activation boxes for a specific sequence lifeline
   */
  createUpdateLifelineActivations(
    diagramId: string,
    shapeId: string,
    oldActivations: ActivationBox[],
    newActivations: ActivationBox[]
  ): Command {
    const updateLocalShape = this.deps.getUpdateLocalShape?.(diagramId);
    return new UpdateLifelineActivationsCommand(
      diagramId,
      shapeId,
      oldActivations,
      newActivations,
      this.deps.getDiagram,
      this.deps._internalUpdateShape,
      updateLocalShape
    );
  }

  /**
   * Refresh all activation boxes in a sequence diagram
   * Should be called when connectors are added, deleted, or modified
   */
  createRefreshSequenceActivations(diagramId: string): Command {
    const updateLocalShape = this.deps.getUpdateLocalShape?.(diagramId);
    return new RefreshSequenceActivationsCommand(
      diagramId,
      this.deps.getDiagram,
      this.deps._internalUpdateShape,
      updateLocalShape
    );
  }
}

import type { Command } from '@/shared/model/commands';
import type { CreateShapeDTO, Shape } from '@/entities/shape';
import type { CreateConnectorDTO, Connector, UpdateConnectorDTO } from '@/entities/connector';
import type { Diagram } from '@/entities/diagram';
import { AddShapeCommand } from '../commands/shapes/AddShapeCommand';
import { DeleteShapeCommand } from '../commands/shapes/DeleteShapeCommand';
import { UpdateShapeLabelCommand } from '../commands/shapes/UpdateShapeLabelCommand';
import { UpdateShapeDataCommand } from '../commands/shapes/UpdateShapeDataCommand';
import { ChangeShapeSubtypeCommand, type ChangeShapeSubtypeData } from '../commands/shapes/ChangeShapeSubtypeCommand';
import { MoveShapeCommand } from '../commands/shapes/MoveShapeCommand';
import { MoveEntitiesCommand } from '../commands/shapes/MoveEntitiesCommand';
import { UpdateParentChildCommand } from '../commands/shapes/UpdateParentChildCommand';
import { AddConnectorCommand } from '../commands/connectors/AddConnectorCommand';
import { DeleteConnectorCommand } from '../commands/connectors/DeleteConnectorCommand';
import { UpdateConnectorLabelCommand } from '../commands/connectors/UpdateConnectorLabelCommand';
import { ChangeConnectorTypeCommand } from '../commands/connectors/ChangeConnectorTypeCommand';
// Generic member commands (class attributes/methods, enumeration literals)
import { AddMemberCommand } from '../commands/members/AddMemberCommand';
import { DeleteMemberCommand } from '../commands/members/DeleteMemberCommand';
import { UpdateMemberCommand } from '../commands/members/UpdateMemberCommand';
import {
  CLASS_ATTRIBUTE_CONFIG,
  CLASS_METHOD_CONFIG,
  ENUMERATION_LITERAL_CONFIG,
} from '../commands/members/member-configs';
import type { ClassShapeData, EnumerationShapeData } from '@/entities/shape';
// Batch operations
import { BatchDeleteShapesCommand } from '../commands/shapes/BatchDeleteShapesCommand';
import { BatchDeleteConnectorsCommand } from '../commands/connectors/BatchDeleteConnectorsCommand';
// Sequence diagram commands
import { UpdateLifelineActivationsCommand } from '../commands/sequence/UpdateLifelineActivationsCommand';
import { RefreshSequenceActivationsCommand } from '../commands/sequence/RefreshSequenceActivationsCommand';
import { UpdateLifelineHeightsCommand } from '../commands/sequence/UpdateLifelineHeightsCommand';
import { ImportMermaidCommand } from '../commands/preview-import/ImportMermaidCommand';
import type { ActivationBox } from '@/entities/shape';
import { ResizeShapesCommand, type ShapeBoundsUpdate } from '../commands/shapes/ResizeShapesCommand';

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
  getCurrentShape?: (diagramId: string, shapeId: string) => Shape | null;
  getCurrentConnector?: (diagramId: string, connectorId: string) => Connector | null;

  // Sequence diagram
  calculateAllLifelineActivations: (shapes: Shape[], connectors: Connector[]) => Map<string, ActivationBox[]>;
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
      this.deps._internalRestoreConnectorsBatch,
      this.deps._internalDeleteShapesBatch,
      this.deps._internalRestoreShapesBatch
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

  createChangeShapeSubtype(
    diagramId: string,
    shapeId: string,
    newSubtypeData: ChangeShapeSubtypeData
  ): Command {
    const updateLocalShape = this.deps.getUpdateLocalShape?.(diagramId);
    return new ChangeShapeSubtypeCommand(
      diagramId,
      shapeId,
      newSubtypeData,
      this.deps._internalUpdateShape,
      this.deps.getCurrentShape || (() => null),
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
      this.deps.getDiagram,
      updateLocalShape
    );
  }

  createUpdateParentChildCommand(
    diagramId: string,
    childShapeId: string,
    newParentId: string | undefined
  ): Command {
    const updateLocalShape = this.deps.getUpdateLocalShape?.(diagramId);
    return new UpdateParentChildCommand(
      diagramId,
      childShapeId,
      newParentId,
      this.deps._internalUpdateShapes,
      this.deps.getDiagram,
      updateLocalShape
    );
  }

  createResizeShapes(
    diagramId: string,
    shapeUpdates: ShapeBoundsUpdate[]
  ): Command {
    const updateLocalShape = this.deps.getUpdateLocalShape?.(diagramId);
    return new ResizeShapesCommand(
      diagramId,
      shapeUpdates,
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
    return new AddMemberCommand<ClassShapeData>(
      {
        diagramId,
        shapeId,
        updateShapeFn: this.deps._internalUpdateShape,
        getShapeFn,
        updateLocalShapeFn: updateLocalShape,
      },
      CLASS_ATTRIBUTE_CONFIG,
      attribute
    );
  }

  createDeleteClassAttribute(
    diagramId: string,
    shapeId: string,
    attributeIndex: number,
    getShapeFn: (shapeId: string) => Shape | undefined
  ): Command {
    const updateLocalShape = this.deps.getUpdateLocalShape?.(diagramId);
    return new DeleteMemberCommand<ClassShapeData>(
      {
        diagramId,
        shapeId,
        updateShapeFn: this.deps._internalUpdateShape,
        getShapeFn,
        updateLocalShapeFn: updateLocalShape,
      },
      CLASS_ATTRIBUTE_CONFIG,
      attributeIndex
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
    return new UpdateMemberCommand<ClassShapeData>(
      {
        diagramId,
        shapeId,
        updateShapeFn: this.deps._internalUpdateShape,
        getShapeFn,
        updateLocalShapeFn: updateLocalShape,
      },
      CLASS_ATTRIBUTE_CONFIG,
      attributeIndex,
      oldValue,
      newValue
    );
  }

  createAddClassMethod(
    diagramId: string,
    shapeId: string,
    method: string,
    getShapeFn: (shapeId: string) => Shape | undefined
  ): Command {
    const updateLocalShape = this.deps.getUpdateLocalShape?.(diagramId);
    return new AddMemberCommand<ClassShapeData>(
      {
        diagramId,
        shapeId,
        updateShapeFn: this.deps._internalUpdateShape,
        getShapeFn,
        updateLocalShapeFn: updateLocalShape,
      },
      CLASS_METHOD_CONFIG,
      method
    );
  }

  createDeleteClassMethod(
    diagramId: string,
    shapeId: string,
    methodIndex: number,
    getShapeFn: (shapeId: string) => Shape | undefined
  ): Command {
    const updateLocalShape = this.deps.getUpdateLocalShape?.(diagramId);
    return new DeleteMemberCommand<ClassShapeData>(
      {
        diagramId,
        shapeId,
        updateShapeFn: this.deps._internalUpdateShape,
        getShapeFn,
        updateLocalShapeFn: updateLocalShape,
      },
      CLASS_METHOD_CONFIG,
      methodIndex
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
    return new UpdateMemberCommand<ClassShapeData>(
      {
        diagramId,
        shapeId,
        updateShapeFn: this.deps._internalUpdateShape,
        getShapeFn,
        updateLocalShapeFn: updateLocalShape,
      },
      CLASS_METHOD_CONFIG,
      methodIndex,
      oldValue,
      newValue
    );
  }

  // ============================================================================
  // Enumeration Diagram Commands
  // ============================================================================

  createAddEnumerationLiteral(
    diagramId: string,
    shapeId: string,
    literal: string,
    getShapeFn: (shapeId: string) => Shape | undefined
  ): Command {
    const updateLocalShape = this.deps.getUpdateLocalShape?.(diagramId);
    return new AddMemberCommand<EnumerationShapeData>(
      {
        diagramId,
        shapeId,
        updateShapeFn: this.deps._internalUpdateShape,
        getShapeFn,
        updateLocalShapeFn: updateLocalShape,
      },
      ENUMERATION_LITERAL_CONFIG,
      literal
    );
  }

  createDeleteEnumerationLiteral(
    diagramId: string,
    shapeId: string,
    literalIndex: number,
    getShapeFn: (shapeId: string) => Shape | undefined
  ): Command {
    const updateLocalShape = this.deps.getUpdateLocalShape?.(diagramId);
    return new DeleteMemberCommand<EnumerationShapeData>(
      {
        diagramId,
        shapeId,
        updateShapeFn: this.deps._internalUpdateShape,
        getShapeFn,
        updateLocalShapeFn: updateLocalShape,
      },
      ENUMERATION_LITERAL_CONFIG,
      literalIndex
    );
  }

  createUpdateEnumerationLiteral(
    diagramId: string,
    shapeId: string,
    literalIndex: number,
    oldValue: string,
    newValue: string,
    getShapeFn: (shapeId: string) => Shape | undefined
  ): Command {
    const updateLocalShape = this.deps.getUpdateLocalShape?.(diagramId);
    return new UpdateMemberCommand<EnumerationShapeData>(
      {
        diagramId,
        shapeId,
        updateShapeFn: this.deps._internalUpdateShape,
        getShapeFn,
        updateLocalShapeFn: updateLocalShape,
      },
      ENUMERATION_LITERAL_CONFIG,
      literalIndex,
      oldValue,
      newValue
    );
  }

  // ============================================================================
  // Entity Relationship Diagram Commands
  // ============================================================================

  /**
   * Get the internal update shape function for use in entity commands
   * This is needed because entity attribute commands need direct access to the update function
   */
  getInternalUpdateShapeFn(): (diagramId: string, shapeId: string, updates: Partial<Shape>) => Promise<Diagram | null> {
    return this.deps._internalUpdateShape;
  }

  /**
   * Get the local shape update function for a diagram
   */
  getUpdateLocalShapeFn(diagramId: string): ((shapeId: string, updates: Partial<Shape>) => void) | undefined {
    return this.deps.getUpdateLocalShape?.(diagramId);
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
      this.deps.calculateAllLifelineActivations,
      updateLocalShape
    );
  }

  /**
   * Update heights for all lifelines in a sequence diagram
   * Should be called when connectors are added, deleted, or modified
   */
  createUpdateLifelineHeights(diagramId: string, newHeight: number): Command {
    const updateLocalShape = this.deps.getUpdateLocalShape?.(diagramId);
    return new UpdateLifelineHeightsCommand(
      diagramId,
      newHeight,
      this.deps.getDiagram,
      this.deps._internalUpdateShape,
      updateLocalShape
    );
  }

  // ============================================================================
  // Import/Export Commands
  // ============================================================================

  /**
   * Import shapes and connectors from Mermaid syntax
   * All imported entities are added as a single undoable operation
   */
  createImportMermaid(
    diagramId: string,
    shapes: Shape[],
    connectors: Connector[]
  ): Command {
    return new ImportMermaidCommand(
      diagramId,
      shapes,
      connectors,
      this.deps._internalRestoreShapesBatch,
      this.deps._internalDeleteShapesBatch,
      this.deps._internalRestoreConnectorsBatch,
      this.deps._internalDeleteConnectorsBatch
    );
  }
}

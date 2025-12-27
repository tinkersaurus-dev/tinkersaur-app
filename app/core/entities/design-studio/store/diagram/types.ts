import type { StateCreator } from 'zustand';
import type { Diagram, CreateDiagramDto, CreateShapeDTO, Shape } from '../../types';
import type { CreateConnectorDTO, Connector } from '../../types/Connector';
import type { CommandFactory } from '~/core/commands/CommandFactory';

/**
 * Base state shared across all diagram store slices.
 */
export interface DiagramStoreBase {
  diagrams: Record<string, Diagram>;
  errors: Record<string, Error | null>;
  commandFactory: CommandFactory;
}

/**
 * Diagram CRUD slice - hydration and lifecycle operations.
 */
export interface DiagramCrudSlice {
  setDiagram: (diagram: Diagram) => void;
  clearDiagram: (id: string) => void;
  createDiagram: (data: CreateDiagramDto) => Promise<Diagram>;
  updateDiagram: (id: string, updates: Partial<Diagram>) => Promise<void>;
  deleteDiagram: (id: string) => Promise<void>;
}

/**
 * Shape operations slice - public and internal methods.
 */
export interface ShapeSlice {
  // Public methods (wrapped in commands)
  addShape: (diagramId: string, shape: CreateShapeDTO) => Promise<string>;
  updateShape: (diagramId: string, shapeId: string, updates: Partial<Shape>) => Promise<void>;
  updateShapes: (
    diagramId: string,
    updates: Array<{ shapeId: string; updates: Partial<Shape> }>
  ) => Promise<void>;
  updateShapeLabel: (diagramId: string, shapeId: string, newLabel: string) => Promise<void>;
  deleteShape: (diagramId: string, shapeId: string) => Promise<void>;
  deleteShapes: (diagramId: string, shapeIds: string[]) => Promise<void>;

  // Internal methods (used by commands, not wrapped)
  _internalAddShape: (
    diagramId: string,
    shape: CreateShapeDTO,
    options?: { skipReferenceCreation?: boolean }
  ) => Promise<Diagram>;
  _internalAddShapesBatch: (
    diagramId: string,
    shapes: CreateShapeDTO[],
    options?: { skipReferenceCreation?: boolean }
  ) => Promise<Diagram>;
  _internalUpdateShape: (
    diagramId: string,
    shapeId: string,
    updates: Partial<Shape>
  ) => Promise<Diagram | null>;
  _internalUpdateShapes: (
    diagramId: string,
    updates: Array<{ shapeId: string; updates: Partial<Shape> }>
  ) => Promise<Diagram | null>;
  _internalDeleteShape: (diagramId: string, shapeId: string) => Promise<Diagram | null>;
  _internalRestoreShape: (diagramId: string, shape: Shape) => Promise<Diagram>;
  _internalGetShape: (diagramId: string, shapeId: string) => Promise<Shape | null>;
  _internalDeleteShapesBatch: (diagramId: string, shapeIds: string[]) => Promise<Diagram | null>;
  _internalRestoreShapesBatch: (diagramId: string, shapes: Shape[]) => Promise<Diagram | null>;
}

/**
 * Connector operations slice - public and internal methods.
 */
export interface ConnectorSlice {
  // Public methods (wrapped in commands)
  addConnector: (diagramId: string, connector: CreateConnectorDTO) => Promise<void>;
  updateConnectorLabel: (
    diagramId: string,
    connectorId: string,
    newLabel: string
  ) => Promise<void>;
  deleteConnector: (diagramId: string, connectorId: string) => Promise<void>;
  deleteConnectors: (diagramId: string, connectorIds: string[]) => Promise<void>;

  // Internal methods (used by commands, not wrapped)
  _internalAddConnector: (
    diagramId: string,
    connector: CreateConnectorDTO
  ) => Promise<Diagram | null>;
  _internalAddConnectorsBatch: (
    diagramId: string,
    connectors: CreateConnectorDTO[]
  ) => Promise<Diagram | null>;
  _internalUpdateConnector: (
    diagramId: string,
    connectorId: string,
    updates: Partial<Connector>
  ) => Promise<Diagram | null>;
  _internalDeleteConnector: (diagramId: string, connectorId: string) => Promise<Diagram | null>;
  _internalRestoreConnector: (diagramId: string, connector: Connector) => Promise<Diagram | null>;
  _internalGetConnector: (diagramId: string, connectorId: string) => Promise<Connector | null>;
  _internalDeleteConnectorsBatch: (
    diagramId: string,
    connectorIds: string[]
  ) => Promise<Diagram | null>;
  _internalRestoreConnectorsBatch: (
    diagramId: string,
    connectors: Connector[]
  ) => Promise<Diagram | null>;
}

/**
 * Mermaid sync slice - utility for mermaid syntax updates.
 */
export interface MermaidSlice {
  _internalUpdateDiagramMermaid: (diagramId: string, mermaidSyntax: string) => void;
}

/**
 * Complete diagram store state combining all slices.
 */
export type DiagramStoreState = DiagramStoreBase &
  DiagramCrudSlice &
  ShapeSlice &
  ConnectorSlice &
  MermaidSlice;

/**
 * Type helper for creating slices that can access the full store state.
 */
export type DiagramSlice<T> = StateCreator<DiagramStoreState, [], [], T>;

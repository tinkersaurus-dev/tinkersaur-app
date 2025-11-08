/**
 * Design Studio Entity Types
 *
 * This module exports all entity types, schemas, and DTOs for the Design Studio.
 * Use these types across the application for type safety and runtime validation.
 */

// DesignWork (folder container)
export {
  DesignWorkSchema,
  CreateDesignWorkSchema,
  UpdateDesignWorkSchema,
  type DesignWork,
  type CreateDesignWorkDto,
  type UpdateDesignWorkDto,
} from './DesignWork';

// Diagram
export {
  DiagramSchema,
  DiagramTypeSchema,
  CreateDiagramSchema,
  UpdateDiagramSchema,
  type Diagram,
  type DiagramType,
  type CreateDiagramDto,
  type UpdateDiagramDto,
} from './Diagram';

// Interface
export {
  InterfaceSchema,
  InterfaceFidelitySchema,
  CreateInterfaceSchema,
  UpdateInterfaceSchema,
  type Interface,
  type InterfaceFidelity,
  type CreateInterfaceDto,
  type UpdateInterfaceDto,
} from './Interface';

// Document
export {
  DocumentSchema,
  CreateDocumentSchema,
  UpdateDocumentSchema,
  type Document,
  type CreateDocumentDto,
  type UpdateDocumentDto,
} from './Document';

// Shape
export {
  PointSchema,
  SizeSchema,
  ShapeSchema,
  CreateShapeSchema,
  UpdateShapeSchema,
  type Point,
  type Size,
  type Shape,
  type CreateShapeDTO,
  type UpdateShapeDTO,
} from './Shape';

// Connector
export {
  ConnectorSchema,
  CreateConnectorSchema,
  UpdateConnectorSchema,
  type Connector,
  type CreateConnectorDTO,
  type UpdateConnectorDTO,
} from './Connector';

// Re-export common type for content type identification
export type DesignContentType = 'diagram' | 'interface' | 'document';

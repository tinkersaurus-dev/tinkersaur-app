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
  DiagramRefSchema,
  InterfaceRefSchema,
  DocumentRefSchema,
  type DesignWork,
  type CreateDesignWorkDto,
  type UpdateDesignWorkDto,
  type DiagramRef,
  type InterfaceRef,
  type DocumentRef,
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
  type ClassShapeData,
  type EnumerationShapeData,
  type SequenceLifelineData,
  type LLMGeneratorShapeData,
  type LLMPreviewShapeData,
  type MermaidEditorShapeData,
  type SuggestionCommentShapeData,
  // Data-level type guards
  isClassShapeData,
  isEnumerationShapeData,
  isSequenceLifelineData,
  isLLMGeneratorShapeData,
  isLLMPreviewShapeData,
  isMermaidEditorShapeData,
  isSuggestionCommentShapeData,
  // Discriminated union shape types
  type BaseShape,
  type TypedShape,
  type ClassShape,
  type EnumerationShape,
  type SequenceLifelineShape,
  type LLMGeneratorShape,
  type LLMPreviewShape,
  type MermaidEditorShape,
  type SuggestionCommentShape,
  // Shape-level type guards
  isClassShape,
  isEnumerationShape,
  isSequenceLifelineShape,
  isLLMGeneratorShape,
  isLLMPreviewShape,
  isMermaidEditorShape,
  isSuggestionCommentShape,
  // Helper functions for type-safe data access
  getClassShapeData,
  getEnumerationShapeData,
  getSequenceLifelineData,
  getLLMPreviewShapeData,
  getMermaidEditorShapeData,
  getSuggestionCommentShapeData,
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

// Reference
export {
  ReferenceSchema,
  CreateReferenceSchema,
  UpdateReferenceSchema,
  ContentTypeSchema,
  ReferenceTypeSchema,
  type Reference,
  type CreateReference,
  type UpdateReference,
  type ContentType,
  type ReferenceType,
  type ReferenceRef,
} from './Reference';

// Re-export common type for content type identification
export type DesignContentType = 'diagram' | 'interface' | 'document';

/**
 * Shape Entity
 * @module entities/shape
 */

// Schemas
export {
  PointSchema,
  SizeSchema,
  ShapeSchema,
  CreateShapeSchema,
  UpdateShapeSchema,
} from './model/types';

// Types
export type {
  Point,
  Size,
  Shape,
  CreateShapeDTO,
  UpdateShapeDTO,
  ClassShapeData,
  EnumerationShapeData,
  EntityAttributeData,
  EntityShapeData,
  ActivationBox,
  SequenceLifelineData,
  LLMGeneratorShapeData,
  LLMPreviewShapeData,
  MermaidEditorShapeData,
  SuggestionCommentShapeData,
  BaseShape,
  RectangleShape,
  BpmnTaskShape,
  BpmnEventShape,
  BpmnGatewayShape,
  SequenceNoteShape,
  ArchitectureServiceShape,
  ArchitectureGroupShape,
  ClassShape,
  EnumerationShape,
  SequenceLifelineShape,
  LLMGeneratorShape,
  LLMPreviewShape,
  MermaidEditorShape,
  SuggestionCommentShape,
  EntityShape,
  GenericShape,
  TypedShape,
} from './model/types';

// Type guards for data
export {
  isClassShapeData,
  isEnumerationShapeData,
  isEntityAttributeData,
  isEntityShapeData,
  isSequenceLifelineData,
  isLLMGeneratorShapeData,
  isLLMPreviewShapeData,
  isMermaidEditorShapeData,
  isSuggestionCommentShapeData,
} from './model/types';

// Type guards for shapes
export {
  isClassShape,
  isEnumerationShape,
  isSequenceLifelineShape,
  isLLMGeneratorShape,
  isLLMPreviewShape,
  isMermaidEditorShape,
  isSuggestionCommentShape,
  isEntityShape,
} from './model/types';

// Helper functions
export {
  getClassShapeData,
  getEnumerationShapeData,
  getSequenceLifelineData,
  getLLMPreviewShapeData,
  getMermaidEditorShapeData,
  getSuggestionCommentShapeData,
  getEntityShapeData,
} from './model/types';

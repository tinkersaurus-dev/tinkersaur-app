import { z } from 'zod';

// Point type for coordinates
export const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export type Point = z.infer<typeof PointSchema>;

// Size type for dimensions
export const SizeSchema = z.object({
  width: z.number(),
  height: z.number(),
});

export type Size = z.infer<typeof SizeSchema>;

// Shape entity - represents a shape on the canvas
export const ShapeSchema = z.object({
  id: z.string(),
  type: z.string(), // 'rectangle', 'circle', 'bpmn-task', etc.
  subtype: z.string().optional(), // Optional subtype for categorization (e.g., 'user', 'service', 'script' for bpmn-task)
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  label: z.string().optional(), // Optional text label for the shape
  zIndex: z.number().default(0),
  locked: z.boolean().default(false),
  isPreview: z.boolean().default(false), // If true, shape is in preview mode (no interactivity)
  // Optional hierarchy support for complex diagrams
  parentId: z.string().optional(),
  children: z.array(z.string()).optional(),
  // Optional type-specific data (e.g., for class diagrams: stereotype, attributes, methods)
  data: z.record(z.string(), z.unknown()).optional(),
  // Optional overlay tag for grouping shapes into show/hide layers (e.g., 'suggestion')
  overlayTag: z.string().optional(),
});

export type Shape = z.infer<typeof ShapeSchema>;

// DTOs for shape creation/updates
export const CreateShapeSchema = ShapeSchema.omit({ id: true });
export type CreateShapeDTO = z.infer<typeof CreateShapeSchema>;

export const UpdateShapeSchema = ShapeSchema.partial().required({ id: true });
export type UpdateShapeDTO = z.infer<typeof UpdateShapeSchema>;

// Type-specific shape data types

// Class diagram shape data
export interface ClassShapeData {
  [key: string]: unknown; // Index signature for compatibility with Record<string, unknown>
  stereotype?: string; // UML stereotype (e.g., 'interface', 'abstract', 'entity')
  attributes: string[]; // Array of attribute strings (e.g., '+ name: string')
  methods: string[]; // Array of method strings (e.g., '+ getName(): string')
}

// Type guard for class shape data
export function isClassShapeData(data: unknown): data is ClassShapeData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    (d.stereotype === undefined || typeof d.stereotype === 'string') &&
    Array.isArray(d.attributes) &&
    d.attributes.every((attr) => typeof attr === 'string') &&
    Array.isArray(d.methods) &&
    d.methods.every((method) => typeof method === 'string')
  );
}

// Enumeration shape data (for UML enumerations)
export interface EnumerationShapeData {
  [key: string]: unknown; // Index signature for compatibility with Record<string, unknown>
  stereotype?: string; // Usually 'enumeration' or undefined
  literals: string[]; // Array of enumeration literal strings (e.g., 'MONDAY', 'TUESDAY')
}

// Type guard for enumeration shape data
export function isEnumerationShapeData(data: unknown): data is EnumerationShapeData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    (d.stereotype === undefined || typeof d.stereotype === 'string') &&
    Array.isArray(d.literals) &&
    d.literals.every((lit) => typeof lit === 'string')
  );
}

// Sequence diagram lifeline activation box
export interface ActivationBox {
  startY: number; // Y-coordinate where activation starts (relative to lifeline)
  endY: number; // Y-coordinate where activation ends (relative to lifeline)
  depth: number; // Nesting depth for nested activations (0 = outermost)
}

// Sequence diagram lifeline shape data
export interface SequenceLifelineData {
  [key: string]: unknown; // Index signature for compatibility with Record<string, unknown>
  lifelineStyle: 'solid' | 'dashed'; // Style of the vertical lifeline
  activations: ActivationBox[]; // Auto-generated activation boxes
  isDestroyed?: boolean; // Whether this lifeline has been destroyed
  destroyedAtY?: number; // Y-coordinate where destruction occurs
}

// Type guard for sequence lifeline data
export function isSequenceLifelineData(data: unknown): data is SequenceLifelineData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    (d.lifelineStyle === 'solid' || d.lifelineStyle === 'dashed') &&
    Array.isArray(d.activations) &&
    d.activations.every(
      (activation: unknown) =>
        activation &&
        typeof activation === 'object' &&
        typeof (activation as ActivationBox).startY === 'number' &&
        typeof (activation as ActivationBox).endY === 'number' &&
        typeof (activation as ActivationBox).depth === 'number'
    ) &&
    (d.isDestroyed === undefined || typeof d.isDestroyed === 'boolean') &&
    (d.destroyedAtY === undefined || typeof d.destroyedAtY === 'number')
  );
}

// LLM Generator shape data (type: 'llm-generator')
export interface LLMGeneratorShapeData {
  [key: string]: unknown; // Index signature for compatibility with Record<string, unknown>
  prompt?: string; // User's natural language prompt
  error?: string; // Error message if generation failed
  isLoading?: boolean; // Whether LLM is currently generating
  referencedDiagramIds?: string[]; // IDs of diagrams to include as context in the prompt
}

// Type guard for LLM generator shape data
export function isLLMGeneratorShapeData(data: unknown): data is LLMGeneratorShapeData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    (d.prompt === undefined || typeof d.prompt === 'string') &&
    (d.error === undefined || typeof d.error === 'string') &&
    (d.isLoading === undefined || typeof d.isLoading === 'boolean') &&
    (d.referencedDiagramIds === undefined ||
      (Array.isArray(d.referencedDiagramIds) &&
       d.referencedDiagramIds.every((id) => typeof id === 'string')))
  );
}

// LLM Preview shape data (type: 'llm-preview')
// Stores metadata about preview content (actual shapes/connectors are in the diagram)
export interface LLMPreviewShapeData {
  [key: string]: unknown; // Index signature for compatibility with Record<string, unknown>
  mermaidSyntax: string; // Generated mermaid syntax
  generatorShapeId: string; // ID of the original generator shape (for undo)
  previewShapeIds: string[]; // IDs of preview shapes in the diagram
  previewConnectorIds: string[]; // IDs of preview connectors in the diagram
}

// Type guard for LLM preview shape data
export function isLLMPreviewShapeData(data: unknown): data is LLMPreviewShapeData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.mermaidSyntax === 'string' &&
    typeof d.generatorShapeId === 'string' &&
    Array.isArray(d.previewShapeIds) &&
    Array.isArray(d.previewConnectorIds)
  );
}

// Mermaid Editor shape data (type: 'mermaid-editor')
export interface MermaidEditorShapeData {
  [key: string]: unknown; // Index signature for compatibility with Record<string, unknown>
  mermaidSyntax: string; // Current mermaid syntax being edited
  previewShapeId: string; // ID of the preview shape that spawned this editor (for undo)
  error?: string; // Parse error if mermaid syntax is invalid
}

// Type guard for mermaid editor shape data
export function isMermaidEditorShapeData(data: unknown): data is MermaidEditorShapeData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.mermaidSyntax === 'string' &&
    typeof d.previewShapeId === 'string' &&
    (d.error === undefined || typeof d.error === 'string')
  );
}

// Suggestion Comment shape data (type: 'suggestion-comment')
export interface SuggestionCommentShapeData {
  [key: string]: unknown; // Index signature for compatibility with Record<string, unknown>
  targetShapeId: string; // ID of the shape this suggestion refers to
  suggestion: string; // The suggestion text
}

// Type guard for suggestion comment shape data
export function isSuggestionCommentShapeData(data: unknown): data is SuggestionCommentShapeData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.targetShapeId === 'string' &&
    typeof d.suggestion === 'string'
  );
}

// ============================================================================
// DISCRIMINATED UNION TYPES FOR TYPE-SAFE SHAPE HANDLING
// ============================================================================

// Base shape properties (common to all shapes)
export interface BaseShape {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  zIndex: number;
  locked: boolean;
  isPreview: boolean;
  parentId?: string;
  children?: string[];
  overlayTag?: string;
  subtype?: string;
}

// Shapes without specialized data
export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  data?: Record<string, unknown>;
}

export interface BpmnTaskShape extends BaseShape {
  type: 'bpmn-task';
  data?: Record<string, unknown>;
}

export interface BpmnEventShape extends BaseShape {
  type: 'bpmn-event';
  data?: Record<string, unknown>;
}

export interface BpmnGatewayShape extends BaseShape {
  type: 'bpmn-gateway';
  data?: Record<string, unknown>;
}

export interface SequenceNoteShape extends BaseShape {
  type: 'sequence-note';
  data?: Record<string, unknown>;
}

export interface ArchitectureServiceShape extends BaseShape {
  type: 'architecture-service';
  data?: Record<string, unknown>;
}

export interface ArchitectureGroupShape extends BaseShape {
  type: 'architecture-group';
  data?: Record<string, unknown>;
}

// Shapes WITH specialized data
export interface ClassShape extends BaseShape {
  type: 'class';
  data: ClassShapeData;
}

export interface EnumerationShape extends BaseShape {
  type: 'enumeration';
  data: EnumerationShapeData;
}

export interface SequenceLifelineShape extends BaseShape {
  type: 'sequence-lifeline';
  data: SequenceLifelineData;
}

export interface LLMGeneratorShape extends BaseShape {
  type: 'llm-generator';
  data?: LLMGeneratorShapeData;
}

export interface LLMPreviewShape extends BaseShape {
  type: 'llm-preview';
  data: LLMPreviewShapeData;
}

export interface MermaidEditorShape extends BaseShape {
  type: 'mermaid-editor';
  data: MermaidEditorShapeData;
}

export interface SuggestionCommentShape extends BaseShape {
  type: 'suggestion-comment';
  data: SuggestionCommentShapeData;
}

// Generic shape type for unknown/future shape types
export interface GenericShape extends BaseShape {
  type: string;
  data?: Record<string, unknown>;
}

// Discriminated union of all known shape types
export type TypedShape =
  | RectangleShape
  | BpmnTaskShape
  | BpmnEventShape
  | BpmnGatewayShape
  | ClassShape
  | EnumerationShape
  | SequenceLifelineShape
  | SequenceNoteShape
  | ArchitectureServiceShape
  | ArchitectureGroupShape
  | LLMGeneratorShape
  | LLMPreviewShape
  | MermaidEditorShape
  | SuggestionCommentShape;

// ============================================================================
// SHAPE-LEVEL TYPE GUARDS
// ============================================================================

export function isClassShape(shape: Shape): shape is ClassShape {
  return shape.type === 'class';
}

export function isEnumerationShape(shape: Shape): shape is EnumerationShape {
  return shape.type === 'enumeration';
}

export function isSequenceLifelineShape(shape: Shape): shape is SequenceLifelineShape {
  return shape.type === 'sequence-lifeline';
}

export function isLLMGeneratorShape(shape: Shape): shape is LLMGeneratorShape {
  return shape.type === 'llm-generator';
}

export function isLLMPreviewShape(shape: Shape): shape is LLMPreviewShape {
  return shape.type === 'llm-preview';
}

export function isMermaidEditorShape(shape: Shape): shape is MermaidEditorShape {
  return shape.type === 'mermaid-editor';
}

export function isSuggestionCommentShape(shape: Shape): shape is SuggestionCommentShape {
  return shape.type === 'suggestion-comment';
}

// ============================================================================
// HELPER FUNCTIONS FOR TYPE-SAFE DATA ACCESS
// ============================================================================

/**
 * Get class shape data with proper typing. Returns default empty data if shape is not a class shape.
 */
export function getClassShapeData(shape: Shape): ClassShapeData {
  if (isClassShape(shape)) {
    return shape.data;
  }
  return { attributes: [], methods: [] };
}

/**
 * Get enumeration shape data with proper typing. Returns default empty data if shape is not an enumeration shape.
 */
export function getEnumerationShapeData(shape: Shape): EnumerationShapeData {
  if (isEnumerationShape(shape)) {
    return shape.data;
  }
  return { literals: [] };
}

/**
 * Get sequence lifeline data with proper typing. Returns default data if shape is not a sequence lifeline.
 */
export function getSequenceLifelineData(shape: Shape): SequenceLifelineData {
  if (isSequenceLifelineShape(shape)) {
    return shape.data;
  }
  return { lifelineStyle: 'solid', activations: [] };
}

/**
 * Get LLM preview shape data. Returns undefined if shape is not an LLM preview shape.
 */
export function getLLMPreviewShapeData(shape: Shape): LLMPreviewShapeData | undefined {
  if (isLLMPreviewShape(shape)) {
    return shape.data;
  }
  return undefined;
}

/**
 * Get mermaid editor shape data. Returns undefined if shape is not a mermaid editor shape.
 */
export function getMermaidEditorShapeData(shape: Shape): MermaidEditorShapeData | undefined {
  if (isMermaidEditorShape(shape)) {
    return shape.data;
  }
  return undefined;
}

/**
 * Get suggestion comment shape data. Returns undefined if shape is not a suggestion comment shape.
 */
export function getSuggestionCommentShapeData(shape: Shape): SuggestionCommentShapeData | undefined {
  if (isSuggestionCommentShape(shape)) {
    return shape.data;
  }
  return undefined;
}

import { memo } from 'react';
import type { ShapeRendererProps, ShapeRendererComponent } from './types';
import { RectangleRenderer } from './RectangleRenderer';
// BPMN renderers
import { BpmnTaskRenderer } from '../../bpmn/rendering/BpmnTaskRenderer';
import { BpmnEventRenderer } from '../../bpmn/rendering/BpmnEventRenderer';
import { BpmnGatewayRenderer } from '../../bpmn/rendering/BpmnGatewayRenderer';
// Class diagram renderers
import { ClassRenderer } from '../../class/rendering/ClassRenderer';
import { EnumerationRenderer } from '../../enumeration/rendering/EnumerationRenderer';
// Sequence diagram renderers
import { SequenceLifelineRenderer } from '../../sequence/rendering/SequenceLifelineRenderer';
import { SequenceNoteRenderer } from '../../sequence/rendering/SequenceNoteRenderer';
// Architecture diagram renderers
import { ArchitectureServiceRenderer } from '../../architecture/rendering/ArchitectureServiceRenderer';
import { ArchitectureGroupRenderer } from '../../architecture/rendering/ArchitectureGroupRenderer';
// LLM/Preview renderers
import { GenerateDiagramRenderer } from './GenerateDiagramRenderer';
import { PreviewRenderer } from './PreviewRenderer';
import { MermaidEditorRenderer } from './MermaidEditorRenderer';
// Overlay/Annotation renderers
import { SuggestionCommentRenderer } from './SuggestionCommentRenderer';

/**
 * Shape Renderer Registry
 *
 * Maps shape types to their renderer components.
 * This registry pattern allows easy addition of new shape types.
 */

const shapeRenderers: Record<string, ShapeRendererComponent> = {
  rectangle: RectangleRenderer,
  // BPMN shape renderers
  'bpmn-task': BpmnTaskRenderer,
  'bpmn-event': BpmnEventRenderer,
  'bpmn-gateway': BpmnGatewayRenderer,
  // Class diagram shape renderers
  class: ClassRenderer,
  enumeration: EnumerationRenderer,
  // Sequence diagram shape renderers
  'sequence-lifeline': SequenceLifelineRenderer,
  'sequence-note': SequenceNoteRenderer,
  // Architecture diagram shape renderers
  'architecture-service': ArchitectureServiceRenderer,
  'architecture-group': ArchitectureGroupRenderer,
  // LLM-powered diagram generation shapes
  'llm-generator': GenerateDiagramRenderer,
  'llm-preview': PreviewRenderer,
  'mermaid-editor': MermaidEditorRenderer,
  // Overlay/Annotation shapes
  'suggestion-comment': SuggestionCommentRenderer,
  // Future shape types can be added here:
  // circle: CircleRenderer,
  // ellipse: EllipseRenderer,
  // text: TextRenderer,
  // etc.
};

/**
 * Shape Renderer Component
 *
 * Routes a shape to its appropriate renderer based on type.
 * Falls back to a simple debug renderer if type is not registered.
 */
function ShapeRendererComponent(props: ShapeRendererProps) {
  const { shape } = props;
  const Renderer = shapeRenderers[shape.type];

  if (!Renderer) {
    console.warn(`No renderer found for shape type: ${shape.type}`);
    // Fallback: render a simple debug rectangle
    return (
      <rect
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        fill="none"
        stroke="red"
        strokeWidth={2}
        strokeDasharray="4 4"
      />
    );
  }

  return <Renderer {...props} />;
}

/**
 * Custom comparison function for React.memo
 * Only re-render if shape properties or context have actually changed
 */
function arePropsEqual(prevProps: ShapeRendererProps, nextProps: ShapeRendererProps): boolean {
  // Always re-render if editing state changes
  if (prevProps.isEditing !== nextProps.isEditing) {
    return false;
  }

  // Check if shape reference or critical properties changed
  const prevShape = prevProps.shape;
  const nextShape = nextProps.shape;

  if (prevShape.id !== nextShape.id) {
    return false;
  }

  // Check position (critical for drag performance)
  if (prevShape.x !== nextShape.x || prevShape.y !== nextShape.y) {
    return false;
  }

  // Check size
  if (prevShape.width !== nextShape.width || prevShape.height !== nextShape.height) {
    return false;
  }

  // Check type and other visual properties
  if (prevShape.type !== nextShape.type || prevShape.label !== nextShape.label) {
    return false;
  }

  // Check context changes (selection, hover, zoom)
  const prevContext = prevProps.context;
  const nextContext = nextProps.context;

  if (
    prevContext.isSelected !== nextContext.isSelected ||
    prevContext.isHovered !== nextContext.isHovered ||
    prevContext.zoom !== nextContext.zoom ||
    prevContext.readOnly !== nextContext.readOnly
  ) {
    return false;
  }

  // Event handlers are usually stable refs from useCallback, but check if they changed
  if (
    prevProps.onMouseDown !== nextProps.onMouseDown ||
    prevProps.onMouseEnter !== nextProps.onMouseEnter ||
    prevProps.onMouseLeave !== nextProps.onMouseLeave ||
    prevProps.onDoubleClick !== nextProps.onDoubleClick
  ) {
    return false;
  }

  // Props are equal - skip re-render
  return true;
}

/**
 * Memoized ShapeRenderer to prevent unnecessary re-renders
 * This is critical for drag performance - non-dragged shapes won't re-render
 */
export const ShapeRenderer = memo(ShapeRendererComponent, arePropsEqual);

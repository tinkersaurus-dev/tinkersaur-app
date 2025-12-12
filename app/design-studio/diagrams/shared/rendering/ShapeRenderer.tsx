import { memo } from 'react';
import type { ShapeRendererProps, ShapeRendererComponent } from './types';
import { createLazyRenderer } from './lazyRenderer';

// Keep eager - small and always used
import { RectangleRenderer } from './RectangleRenderer';

// Lazy load diagram-specific renderers for code splitting
// BPMN renderers
const BpmnTaskRenderer = createLazyRenderer(
  () => import('../../bpmn/rendering/BpmnTaskRenderer'),
  'BpmnTaskRenderer'
);
const BpmnEventRenderer = createLazyRenderer(
  () => import('../../bpmn/rendering/BpmnEventRenderer'),
  'BpmnEventRenderer'
);
const BpmnGatewayRenderer = createLazyRenderer(
  () => import('../../bpmn/rendering/BpmnGatewayRenderer'),
  'BpmnGatewayRenderer'
);

// Class diagram renderers (includes class and enumeration shapes)
const ClassRenderer = createLazyRenderer(
  () => import('../../class/rendering/ClassRenderer'),
  'ClassRenderer'
);
const EnumerationRenderer = createLazyRenderer(
  () => import('../../class/rendering/EnumerationRenderer'),
  'EnumerationRenderer'
);

// Sequence diagram renderers
const SequenceLifelineRenderer = createLazyRenderer(
  () => import('../../sequence/rendering/SequenceLifelineRenderer'),
  'SequenceLifelineRenderer'
);
const SequenceNoteRenderer = createLazyRenderer(
  () => import('../../sequence/rendering/SequenceNoteRenderer'),
  'SequenceNoteRenderer'
);

// Architecture diagram renderers
const ArchitectureServiceRenderer = createLazyRenderer(
  () => import('../../architecture/rendering/ArchitectureServiceRenderer'),
  'ArchitectureServiceRenderer'
);
const ArchitectureGroupRenderer = createLazyRenderer(
  () => import('../../architecture/rendering/ArchitectureGroupRenderer'),
  'ArchitectureGroupRenderer'
);

// LLM/Preview renderers
const GenerateDiagramRenderer = createLazyRenderer(
  () => import('./GenerateDiagramRenderer'),
  'GenerateDiagramRenderer'
);
const PreviewRenderer = createLazyRenderer(
  () => import('./PreviewRenderer'),
  'PreviewRenderer'
);
const MermaidEditorRenderer = createLazyRenderer(
  () => import('./MermaidEditorRenderer'),
  'MermaidEditorRenderer'
);

// Overlay/Annotation renderers
const SuggestionCommentRenderer = createLazyRenderer(
  () => import('./SuggestionCommentRenderer'),
  'SuggestionCommentRenderer'
);

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

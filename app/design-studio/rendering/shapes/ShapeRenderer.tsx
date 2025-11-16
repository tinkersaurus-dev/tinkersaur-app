import type { ShapeRendererProps, ShapeRendererComponent } from './types';
import { RectangleRenderer } from './RectangleRenderer';
import { BpmnTaskRenderer } from './BpmnTaskRenderer';
import { BpmnEventRenderer } from './BpmnEventRenderer';
import { BpmnGatewayRenderer } from './BpmnGatewayRenderer';
import { ClassRenderer } from './ClassRenderer';
import { SequenceLifelineRenderer } from './SequenceLifelineRenderer';
import { SequenceNoteRenderer } from './SequenceNoteRenderer';
import { GenerateDiagramRenderer } from './GenerateDiagramRenderer';
import { PreviewRenderer } from './PreviewRenderer';
import { MermaidEditorRenderer } from './MermaidEditorRenderer';

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
  // Sequence diagram shape renderers
  'sequence-lifeline': SequenceLifelineRenderer,
  'sequence-note': SequenceNoteRenderer,
  // LLM-powered diagram generation shapes
  'llm-generator': GenerateDiagramRenderer,
  'llm-preview': PreviewRenderer,
  'mermaid-editor': MermaidEditorRenderer,
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
export function ShapeRenderer(props: ShapeRendererProps) {
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

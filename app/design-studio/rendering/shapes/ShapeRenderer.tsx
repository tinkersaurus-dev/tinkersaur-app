import type { ShapeRendererProps, ShapeRendererComponent } from './types';
import { RectangleRenderer } from './RectangleRenderer';

/**
 * Shape Renderer Registry
 *
 * Maps shape types to their renderer components.
 * This registry pattern allows easy addition of new shape types.
 */

const shapeRenderers: Record<string, ShapeRendererComponent> = {
  rectangle: RectangleRenderer,
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

/**
 * Register a new shape renderer
 *
 * Allows dynamic registration of shape renderers.
 * Useful for plugins or lazy-loaded shape types.
 */
export function registerShapeRenderer(type: string, renderer: ShapeRendererComponent) {
  shapeRenderers[type] = renderer;
}

/**
 * Check if a shape type has a registered renderer
 */
export function hasShapeRenderer(type: string): boolean {
  return type in shapeRenderers;
}

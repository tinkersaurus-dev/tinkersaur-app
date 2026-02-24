// Diagram Rendering Feature
// All diagram-specific rendering, tools, and utilities

// Shared rendering primitives
export * from './shared';

// Shape interactivity
export { useShapeInteractivity } from './lib/useShapeInteractivity';

// Canvas instance hook (maps diagram type → default connector type)
export { useCanvasInstance } from './useCanvasInstance';

// Note: For diagram-specific types (bpmn, class, sequence, etc.),
// import directly from the specific module to avoid naming conflicts
// Example: import { BpmnTaskRenderer } from '@/features/diagram-rendering/bpmn';

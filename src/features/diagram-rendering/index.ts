// Diagram Rendering Feature
// All diagram-specific rendering, tools, and utilities

// Shared rendering primitives
export * from './shared';

// Shape interactivity
export { useShapeInteractivity } from './lib/useShapeInteractivity';

// Note: For diagram-specific types (bpmn, class, sequence, etc.),
// import directly from the specific module to avoid naming conflicts
// Example: import { BpmnTaskRenderer } from '@/features/diagram-rendering/bpmn';

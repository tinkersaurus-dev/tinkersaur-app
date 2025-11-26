// Diagrams Module
// Central export for all diagram types

// Note: Not re-exporting everything to avoid naming conflicts (Tool, ToolGroup, etc.)
// Import directly from diagram-specific modules instead:
//   import { ... } from '~/design-studio/diagrams/bpmn'

// Re-export shared rendering and mermaid
export * from './shared';

// Export diagram-specific modules as namespaces to avoid conflicts
export * as bpmn from './bpmn';
export * as architecture from './architecture';
export * as classDiagram from './class';
export * as sequence from './sequence';
export * as enumeration from './enumeration';

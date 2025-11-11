/**
 * Mermaid export functionality for Design Studio diagrams
 *
 * This module provides exporters for converting diagrams to Mermaid syntax.
 * Each diagram type has its own exporter implementation.
 */

import { registerMermaidExporter } from './mermaid-parser-registry';
import { createBpmnMermaidExporter } from './exporters/bpmn-mermaid-exporter';
import { createClassMermaidExporter } from './exporters/class-mermaid-exporter';

// Register all available exporters
registerMermaidExporter('bpmn', createBpmnMermaidExporter);
registerMermaidExporter('class', createClassMermaidExporter);

// Re-export public API
export { getMermaidExporter, hasMermaidExporter, getSupportedDiagramTypes } from './mermaid-parser-registry';
export type { MermaidExporter, MermaidExportOptions, MermaidExportResult } from './mermaid-exporter';

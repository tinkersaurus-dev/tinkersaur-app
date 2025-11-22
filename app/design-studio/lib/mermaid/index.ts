/**
 * Mermaid import/export functionality for Design Studio diagrams
 *
 * This module provides exporters for converting diagrams to Mermaid syntax,
 * and importers for parsing Mermaid syntax back to diagrams.
 * Each diagram type has its own exporter and importer implementation.
 */

import {
  registerMermaidExporter,
  registerMermaidImporter,
} from './mermaid-parser-registry';
import { createBpmnMermaidExporter } from './exporters/bpmn-mermaid-exporter';
import { createClassMermaidExporter } from './exporters/class-mermaid-exporter';
import { createSequenceMermaidExporter } from './exporters/sequence-mermaid-exporter';
import { createArchitectureMermaidExporter } from './exporters/architecture-mermaid-exporter';
import { createBpmnMermaidImporter } from './importers/bpmn-mermaid-importer';
import { createClassMermaidImporter } from './importers/class-mermaid-importer';
import { createSequenceMermaidImporter } from './importers/sequence-mermaid-importer';
import { createArchitectureMermaidImporter } from './importers/architecture-mermaid-importer';

// Register all available exporters
registerMermaidExporter('bpmn', createBpmnMermaidExporter);
registerMermaidExporter('class', createClassMermaidExporter);
registerMermaidExporter('sequence', createSequenceMermaidExporter);
registerMermaidExporter('architecture', createArchitectureMermaidExporter);

// Register all available importers
registerMermaidImporter('bpmn', createBpmnMermaidImporter);
registerMermaidImporter('class', createClassMermaidImporter);
registerMermaidImporter('sequence', createSequenceMermaidImporter);
registerMermaidImporter('architecture', createArchitectureMermaidImporter);

// Re-export public API
export {
  getMermaidExporter,
  hasMermaidExporter,
  getSupportedDiagramTypes,
  getMermaidImporter,
  hasMermaidImporter,
  getSupportedImportDiagramTypes,
} from './mermaid-parser-registry';
export type {
  MermaidExporter,
  MermaidExportOptions,
  MermaidExportResult,
} from './mermaid-exporter';
export type {
  MermaidImporter,
  MermaidImportOptions,
  MermaidImportResult,
} from './mermaid-importer';

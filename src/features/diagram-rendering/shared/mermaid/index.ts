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
} from './registry';
import { createBpmnMermaidExporter } from '../../bpmn/mermaid/exporter';
import { createClassMermaidExporter } from '../../class/mermaid/exporter';
import { createSequenceMermaidExporter } from '../../sequence/mermaid/exporter';
import { createArchitectureMermaidExporter } from '../../architecture/mermaid/exporter';
import { createEntityRelationshipMermaidExporter } from '../../entity-relationship/mermaid/exporter';
import { createBpmnMermaidImporter } from '../../bpmn/mermaid/importer';
import { createClassMermaidImporter } from '../../class/mermaid/importer';
import { createSequenceMermaidImporter } from '../../sequence/mermaid/importer';
import { createArchitectureMermaidImporter } from '../../architecture/mermaid/importer';
import { createEntityRelationshipMermaidImporter } from '../../entity-relationship/mermaid/importer';

// Register all available exporters
registerMermaidExporter('bpmn', createBpmnMermaidExporter);
registerMermaidExporter('class', createClassMermaidExporter);
registerMermaidExporter('sequence', createSequenceMermaidExporter);
registerMermaidExporter('architecture', createArchitectureMermaidExporter);
registerMermaidExporter('entity-relationship', createEntityRelationshipMermaidExporter);

// Register all available importers
registerMermaidImporter('bpmn', createBpmnMermaidImporter);
registerMermaidImporter('class', createClassMermaidImporter);
registerMermaidImporter('sequence', createSequenceMermaidImporter);
registerMermaidImporter('architecture', createArchitectureMermaidImporter);
registerMermaidImporter('entity-relationship', createEntityRelationshipMermaidImporter);

// Re-export public API
export {
  getMermaidExporter,
  hasMermaidExporter,
  getMermaidImporter,
} from './registry';
export type {
  MermaidExporter,
  MermaidExportOptions,
  MermaidExportResult,
} from './exporter';
export type {
  MermaidImporter,
  MermaidImportOptions,
  MermaidImportResult,
} from './importer';

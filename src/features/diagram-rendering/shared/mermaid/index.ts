/**
 * Mermaid import/export registration for Design Studio diagrams
 *
 * This module registers diagram-specific mermaid importers and exporters.
 * Types and registry functions are now in @/shared/lib/mermaid.
 */

import {
  registerMermaidExporter,
  registerMermaidImporter,
} from '@/shared/lib/mermaid';
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

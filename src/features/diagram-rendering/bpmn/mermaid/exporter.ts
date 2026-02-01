import type { Result } from '@/shared/lib/utils';
import type { Shape } from '@/entities/shape';
import type { Connector } from '@/entities/connector';
import type {
  MermaidExportOptions,
  MermaidExportResult,
} from '../../shared/mermaid/exporter';
import { BaseMermaidExporter } from '../../shared/mermaid/exporter';

/**
 * Mermaid exporter for BPMN diagrams
 * Converts BPMN shapes and connectors to Mermaid flowchart syntax
 */
export class BpmnMermaidExporter extends BaseMermaidExporter {
  getDiagramType(): string {
    return 'bpmn';
  }

  export(shapes: Shape[], connectors: Connector[]): Result<MermaidExportResult> {
    // Filter out overlay elements (e.g., suggestions) before export
    const filteredShapes = this.filterOverlayElements(shapes);
    const filteredConnectors = this.filterOverlayConnectors(connectors);

    const validationResult = this.validate(filteredShapes, filteredConnectors);
    if (!validationResult.ok) {
      return validationResult;
    }

    try {
      const lines: string[] = [];

      // Add diagram type and direction
      lines.push(`flowchart ${this.options.direction}`);

      // Add metadata comments if enabled
      if (this.options.includeComments) {
        lines.push('');
        lines.push(`%% Generated: ${new Date().toISOString()}`);
        lines.push(`%% Shapes: ${filteredShapes.length}, Connectors: ${filteredConnectors.length}`);
        lines.push('');
      }

      // Create alphabetic ID mapping (A, B, C, ...)
      const idMap = this.createAlphabeticIdMap(filteredShapes);

      // Create shape lookup for quick access
      const shapeMap = new Map<string, Shape>();
      filteredShapes.forEach((shape) => shapeMap.set(shape.id, shape));

      // Export connectors with inline node definitions
      const exportedNodes = new Set<string>();

      for (const connector of filteredConnectors) {
        const sourceShape = shapeMap.get(connector.sourceShapeId);
        const targetShape = shapeMap.get(connector.targetShapeId);

        // Skip connector if source or target shape not found
        if (!sourceShape || !targetShape) {
          continue;
        }

        const sourceNodeDef = this.getNodeShapeSyntax(sourceShape, idMap);
        const targetNodeDef = this.getNodeShapeSyntax(targetShape, idMap);

        // Determine arrow syntax based on connector marker
        const arrowSyntax = this.getArrowSyntax(connector);

        // Add connector label if present
        const labelSyntax = connector.label
          ? `|${this.sanitizeText(connector.label)}|`
          : '';

        lines.push(
          `${this.getIndent()}${sourceNodeDef} ${arrowSyntax}${labelSyntax} ${targetNodeDef}`
        );

        exportedNodes.add(sourceShape.id);
        exportedNodes.add(targetShape.id);
      }

      // Export standalone nodes (shapes without connectors)
      for (const shape of filteredShapes) {
        if (!exportedNodes.has(shape.id)) {
          const nodeDef = this.getNodeShapeSyntax(shape, idMap);
          lines.push(`${this.getIndent()}${nodeDef}`);
        }
      }

      const syntax = lines.join('\n');

      const metadata = this.options.includeMetadata
        ? {
            diagramType: this.getDiagramType(),
            nodeCount: filteredShapes.length,
            edgeCount: filteredConnectors.length,
            exportedAt: new Date(),
          }
        : undefined;

      return {
        ok: true,
        value: {
          syntax,
          metadata,
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: `Failed to export BPMN diagram: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get mermaid node shape syntax based on BPMN shape type
   */
  private getNodeShapeSyntax(shape: Shape, idMap: Map<string, string>): string {
    const nodeId = idMap.get(shape.id) || this.sanitizeId(shape.id);
    const nodeText = this.sanitizeText(shape.label || '');

    const shapeType = shape.type;
    const subType = shape.subtype;

    // BPMN Events
    if (shapeType === 'bpmn-event') {
      if (subType === 'end' || subType === 'end-event') {
        return `${nodeId}((("${nodeText || 'End'}")))`;
      }
      if (subType === 'intermediate' || subType === 'intermediate-event') {
        return `${nodeId}(("${nodeText || 'Event'}"))`;
      }
      // Start event or default
      return `${nodeId}(("${nodeText || 'Start'}"))`;
    }

    // BPMN Tasks
    if (shapeType === 'bpmn-task') {
      return `${nodeId}["${nodeText || 'Task'}"]`;
    }

    // BPMN Gateways
    if (shapeType === 'bpmn-gateway') {
      return `${nodeId}{"${nodeText || 'Gateway'}"}`;
    }

    // BPMN Sub-process (rectangle with rounded corners)
    if (shapeType === 'bpmn-subprocess') {
      return `${nodeId}("${nodeText || 'Sub-process'}")`;
    }

    // Generic rectangle
    if (shapeType === 'rectangle') {
      return `${nodeId}["${nodeText || 'Process'}"]`;
    }

    // Circle
    if (shapeType === 'circle') {
      return `${nodeId}(("${nodeText || 'Node'}"))`;
    }

    // Diamond
    if (shapeType === 'diamond') {
      return `${nodeId}{"${nodeText || 'Decision'}"}`;
    }

    // Default fallback
    return `${nodeId}["${nodeText || 'Node'}"]`;
  }

  /**
   * Get mermaid arrow syntax based on connector type and markers
   */
  private getArrowSyntax(connector: Connector): string {
    const markerEnd = connector.markerEnd || 'arrow';
    const lineType = connector.lineType || 'solid';

    // Dashed line
    if (lineType === 'dashed') {
      if (markerEnd === 'none') {
        return '-.-';
      }
      return '-.->'; // Dashed with arrow
    }

    // Dotted line
    if (lineType === 'dotted') {
      if (markerEnd === 'none') {
        return '-.-';
      }
      return '-.->'; // Dotted with arrow
    }

    // Solid line (default)
    if (markerEnd === 'none') {
      return '---';
    }

    return '-->'; // Solid with arrow
  }
}

/**
 * Factory function to create a BPMN mermaid exporter
 */
export function createBpmnMermaidExporter(
  options?: MermaidExportOptions
): BpmnMermaidExporter {
  return new BpmnMermaidExporter(options);
}

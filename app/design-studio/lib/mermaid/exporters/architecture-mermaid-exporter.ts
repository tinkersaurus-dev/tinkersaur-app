import type { Result } from '~/core/lib/utils/result';
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Connector } from '~/core/entities/design-studio/types/Connector';
import type {
  MermaidExportOptions,
  MermaidExportResult,
} from '../mermaid-exporter';
import { BaseMermaidExporter } from '../mermaid-exporter';

/**
 * Mermaid exporter for Architecture diagrams
 * Converts architecture shapes and connectors to Mermaid architecture-beta syntax
 */
export class ArchitectureMermaidExporter extends BaseMermaidExporter {
  getDiagramType(): string {
    return 'architecture';
  }

  export(shapes: Shape[], connectors: Connector[]): Result<MermaidExportResult> {
    const validationResult = this.validate(shapes, connectors);
    if (!validationResult.ok) {
      return validationResult;
    }

    try {
      const lines: string[] = [];

      // Add diagram type
      lines.push('architecture-beta');

      // Add metadata comments if enabled
      if (this.options.includeComments) {
        lines.push('');
        lines.push(`%% Generated: ${new Date().toISOString()}`);
        lines.push(`%% Services: ${shapes.filter(s => s.type === 'architecture-service').length}, Groups: ${shapes.filter(s => s.type === 'architecture-group').length}, Junctions: ${shapes.filter(s => s.type === 'architecture-junction').length}`);
        lines.push('');
      }

      // Create ID mapping (use sanitized IDs for Mermaid compatibility)
      const idMap = new Map<string, string>();
      shapes.forEach((shape, index) => {
        // Use shape label or generate ID based on type and index
        const baseId = shape.label
          ? this.sanitizeId(shape.label.toLowerCase().replace(/\s+/g, '_'))
          : `${shape.type.replace('architecture-', '')}_${index}`;
        idMap.set(shape.id, baseId);
      });

      // Create shape lookup
      const shapeMap = new Map<string, Shape>();
      shapes.forEach((shape) => shapeMap.set(shape.id, shape));

      // Export groups first
      const groups = shapes.filter(s => s.type === 'architecture-group');
      for (const group of groups) {
        const mermaidId = idMap.get(group.id) || this.sanitizeId(group.id);
        const icon = (group.data as Record<string, unknown>)?.icon || 'box';
        const label = this.sanitizeText(group.label || 'Group');

        // Check if this group has a parent
        let parentSuffix = '';
        if (group.parentId) {
          const parentMermaidId = idMap.get(group.parentId) || this.sanitizeId(group.parentId);
          parentSuffix = ` in ${parentMermaidId}`;
        }

        lines.push(`${this.getIndent()}group ${mermaidId}(${icon})[${label}]${parentSuffix}`);
      }

      // Export services
      const services = shapes.filter(s => s.type === 'architecture-service');
      for (const service of services) {
        const mermaidId = idMap.get(service.id) || this.sanitizeId(service.id);
        const icon = (service.data as Record<string, unknown>)?.icon || 'server';
        const label = this.sanitizeText(service.label || 'Service');

        // Check if this service has a parent
        let parentSuffix = '';
        if (service.parentId) {
          const parentMermaidId = idMap.get(service.parentId) || this.sanitizeId(service.parentId);
          parentSuffix = ` in ${parentMermaidId}`;
        }

        lines.push(`${this.getIndent()}service ${mermaidId}(${icon})[${label}]${parentSuffix}`);
      }

      // Export junctions
      const junctions = shapes.filter(s => s.type === 'architecture-junction');
      for (const junction of junctions) {
        const mermaidId = idMap.get(junction.id) || this.sanitizeId(junction.id);

        // Check if this junction has a parent
        let parentSuffix = '';
        if (junction.parentId) {
          const parentMermaidId = idMap.get(junction.parentId) || this.sanitizeId(junction.parentId);
          parentSuffix = ` in ${parentMermaidId}`;
        }

        lines.push(`${this.getIndent()}junction ${mermaidId}${parentSuffix}`);
      }

      // Export connectors (edges)
      lines.push('');
      for (const connector of connectors) {
        const sourceShape = shapeMap.get(connector.sourceShapeId);
        const targetShape = shapeMap.get(connector.targetShapeId);

        // Skip connector if source or target shape not found
        if (!sourceShape || !targetShape) {
          continue;
        }

        const sourceId = idMap.get(sourceShape.id) || this.sanitizeId(sourceShape.id);
        const targetId = idMap.get(targetShape.id) || this.sanitizeId(targetShape.id);

        // Determine arrow syntax based on connector type
        let arrowSyntax = '-->';
        if (connector.markerStart === 'arrow' && connector.markerEnd === 'arrow') {
          arrowSyntax = '<-->';
        } else if (connector.markerStart === 'arrow' && connector.markerEnd === 'none') {
          arrowSyntax = '<--';
        }

        // Default direction indicators (simplified - real implementation would use connection points)
        const sourceDir = 'R'; // Right
        const targetDir = 'L'; // Left

        lines.push(
          `${this.getIndent()}${sourceId}:${sourceDir} ${arrowSyntax} ${targetDir}:${targetId}`
        );
      }

      const syntax = lines.join('\n');

      const metadata = this.options.includeMetadata
        ? {
            diagramType: this.getDiagramType(),
            nodeCount: shapes.length,
            edgeCount: connectors.length,
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
        error: `Failed to export architecture diagram: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

/**
 * Factory function to create an architecture exporter
 */
export function createArchitectureMermaidExporter(options?: MermaidExportOptions): ArchitectureMermaidExporter {
  return new ArchitectureMermaidExporter(options);
}

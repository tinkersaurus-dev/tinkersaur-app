import type { Result } from '@/shared/lib/utils';
import type { Shape, EntityShapeData, EntityAttributeData } from '@/entities/shape';
import type { Connector } from '@/entities/connector';
import type {
  MermaidExportOptions,
  MermaidExportResult,
} from '@/shared/lib/mermaid';
import { isEntityShapeData } from '@/entities/shape';
import { BaseMermaidExporter } from '@/shared/lib/mermaid';

/**
 * Mermaid exporter for Entity Relationship diagrams
 * Converts entity shapes and relationships to Mermaid ER diagram syntax
 */
export class EntityRelationshipMermaidExporter extends BaseMermaidExporter {
  getDiagramType(): string {
    return 'entity-relationship';
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

      // Add diagram type
      lines.push('erDiagram');

      // Add metadata comments if enabled
      if (this.options.includeComments) {
        lines.push('');
        lines.push(`%% Generated: ${new Date().toISOString()}`);
        lines.push(`%% Entities: ${filteredShapes.length}, Relationships: ${filteredConnectors.length}`);
        lines.push('');
      }

      // Create shape lookup for quick access
      const shapeMap = new Map<string, Shape>();
      filteredShapes.forEach((shape) => shapeMap.set(shape.id, shape));

      // Create entity name mapping (sanitized IDs)
      const entityNameMap = this.createEntityNameMap(filteredShapes);

      // Export entity definitions
      for (const shape of filteredShapes) {
        const entityLines = this.getEntityDefinition(shape, entityNameMap);
        lines.push(...entityLines);
      }

      // Add spacing between entities and relationships
      if (filteredConnectors.length > 0) {
        lines.push('');
      }

      // Export relationships
      for (const connector of filteredConnectors) {
        const sourceShape = shapeMap.get(connector.sourceShapeId);
        const targetShape = shapeMap.get(connector.targetShapeId);

        // Skip connector if source or target shape not found
        if (!sourceShape || !targetShape) {
          continue;
        }

        const relationshipLine = this.getRelationshipSyntax(
          connector,
          sourceShape,
          targetShape,
          entityNameMap
        );
        if (relationshipLine) {
          lines.push(`${this.getIndent()}${relationshipLine}`);
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
        error: `Failed to export ER diagram: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Create entity name mapping (sanitized entity names from shape labels)
   */
  private createEntityNameMap(shapes: Shape[]): Map<string, string> {
    const entityNameMap = new Map<string, string>();
    const usedNames = new Set<string>();

    shapes.forEach((shape) => {
      const entityName = this.sanitizeEntityName(shape.label || 'Entity');

      // Ensure unique entity names
      let uniqueName = entityName;
      let counter = 1;
      while (usedNames.has(uniqueName)) {
        uniqueName = `${entityName}${counter}`;
        counter++;
      }

      entityNameMap.set(shape.id, uniqueName);
      usedNames.add(uniqueName);
    });

    return entityNameMap;
  }

  /**
   * Sanitize entity name for mermaid (alphanumeric and underscores only)
   */
  private sanitizeEntityName(name: string): string {
    // Replace spaces with underscores, remove special characters
    let sanitized = name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

    // Ensure starts with a letter
    if (sanitized.length === 0 || /^[0-9]/.test(sanitized)) {
      sanitized = 'Entity_' + sanitized;
    }

    // Convert to uppercase (convention for ER diagrams)
    return sanitized.toUpperCase();
  }

  /**
   * Get entity definition lines for a shape
   */
  private getEntityDefinition(shape: Shape, entityNameMap: Map<string, string>): string[] {
    const lines: string[] = [];
    const entityName = entityNameMap.get(shape.id) || 'ENTITY';

    // Check if shape has entity-specific data
    if (shape.data && isEntityShapeData(shape.data)) {
      const entityData = shape.data as EntityShapeData;

      if (entityData.attributes && entityData.attributes.length > 0) {
        // Add entity with attributes
        lines.push(`${this.getIndent()}${entityName} {`);

        for (const attr of entityData.attributes) {
          const attrLine = this.formatAttribute(attr);
          lines.push(`${this.getIndent(2)}${attrLine}`);
        }

        lines.push(`${this.getIndent()}}`);
      } else {
        // Simple entity without attributes
        lines.push(`${this.getIndent()}${entityName} {`);
        lines.push(`${this.getIndent()}}`);
      }
    } else {
      // Simple entity without attributes
      lines.push(`${this.getIndent()}${entityName} {`);
      lines.push(`${this.getIndent()}}`);
    }

    return lines;
  }

  /**
   * Format an entity attribute for Mermaid syntax
   * Mermaid format: type name PK/FK/UK "comment"
   */
  private formatAttribute(attr: EntityAttributeData): string {
    let line = `${this.sanitizeType(attr.type)} ${this.sanitizeName(attr.name)}`;

    if (attr.key) {
      line += ` ${attr.key}`;
    }

    if (attr.comment) {
      line += ` "${this.sanitizeText(attr.comment)}"`;
    }

    return line;
  }

  /**
   * Sanitize type name for mermaid
   */
  private sanitizeType(type: string): string {
    return type.replace(/[^a-zA-Z0-9_]/g, '');
  }

  /**
   * Sanitize attribute name for mermaid
   */
  private sanitizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, '');
  }

  /**
   * Get relationship syntax between two entities
   * Mermaid format: ENTITY1 ||--o{ ENTITY2 : "relationship_label"
   */
  private getRelationshipSyntax(
    connector: Connector,
    sourceShape: Shape,
    targetShape: Shape,
    entityNameMap: Map<string, string>
  ): string | null {
    const sourceEntity = entityNameMap.get(sourceShape.id);
    const targetEntity = entityNameMap.get(targetShape.id);

    if (!sourceEntity || !targetEntity) {
      return null;
    }

    // Get cardinality markers for source and target
    const sourceCardinality = this.getCrowFootSyntax(connector.markerStart || 'crow-one');
    const targetCardinality = this.getCrowFootSyntax(connector.markerEnd || 'crow-many');

    // Determine line style (identifying vs non-identifying)
    const lineStyle = connector.lineType === 'dashed' ? '..' : '--';

    // Build the relationship line
    let result = `${sourceEntity} ${sourceCardinality}${lineStyle}${targetCardinality} ${targetEntity}`;

    // Add label if present
    if (connector.label) {
      result += ` : "${this.sanitizeText(connector.label)}"`;
    }

    return result;
  }

  /**
   * Convert crow's foot arrow type to Mermaid syntax
   */
  private getCrowFootSyntax(arrowType: string): string {
    switch (arrowType) {
      case 'crow-one':
        return '||';
      case 'crow-zero-one':
        return 'o|';
      case 'crow-many':
        return '}|';
      case 'crow-zero-many':
        return '}o';
      default:
        // Default to exactly one
        return '||';
    }
  }
}

/**
 * Factory function to create an ER diagram mermaid exporter
 */
export function createEntityRelationshipMermaidExporter(
  options?: MermaidExportOptions
): EntityRelationshipMermaidExporter {
  return new EntityRelationshipMermaidExporter(options);
}

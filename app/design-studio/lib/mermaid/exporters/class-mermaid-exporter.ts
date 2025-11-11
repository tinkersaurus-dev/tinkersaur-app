import type { Result } from '~/core/lib/utils/result';
import type { Shape, ClassShapeData } from '~/core/entities/design-studio/types/Shape';
import type { Connector } from '~/core/entities/design-studio/types/Connector';
import type {
  MermaidExportOptions,
  MermaidExportResult,
} from '../mermaid-exporter';
import { isClassShapeData } from '~/core/entities/design-studio/types/Shape';
import { BaseMermaidExporter } from '../mermaid-exporter';

/**
 * Mermaid exporter for Class diagrams
 * Converts class shapes and relationships to Mermaid class diagram syntax
 */
export class ClassMermaidExporter extends BaseMermaidExporter {
  getDiagramType(): string {
    return 'class';
  }

  export(shapes: Shape[], connectors: Connector[]): Result<MermaidExportResult> {
    const validationResult = this.validate(shapes, connectors);
    if (!validationResult.ok) {
      return validationResult;
    }

    try {
      const lines: string[] = [];

      // Add diagram type
      lines.push('classDiagram');

      // Add metadata comments if enabled
      if (this.options.includeComments) {
        lines.push('');
        lines.push(`%% Generated: ${new Date().toISOString()}`);
        lines.push(`%% Classes: ${shapes.length}, Relationships: ${connectors.length}`);
        lines.push('');
      }

      // Create shape lookup for quick access
      const shapeMap = new Map<string, Shape>();
      shapes.forEach((shape) => shapeMap.set(shape.id, shape));

      // Create class name mapping (sanitized IDs)
      const classNameMap = this.createClassNameMap(shapes);

      // Export class definitions
      for (const shape of shapes) {
        const classLines = this.getClassDefinition(shape, classNameMap);
        lines.push(...classLines);
      }

      // Add spacing between classes and relationships
      if (connectors.length > 0) {
        lines.push('');
      }

      // Export relationships
      for (const connector of connectors) {
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
          classNameMap
        );
        if (relationshipLine) {
          lines.push(`${this.getIndent()}${relationshipLine}`);
        }
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
        error: `Failed to export Class diagram: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Create class name mapping (sanitized class names from shape labels)
   */
  private createClassNameMap(shapes: Shape[]): Map<string, string> {
    const classNameMap = new Map<string, string>();
    const usedNames = new Set<string>();

    shapes.forEach((shape) => {
      let className = this.sanitizeClassName(shape.label || 'Class');

      // Ensure unique class names
      let uniqueName = className;
      let counter = 1;
      while (usedNames.has(uniqueName)) {
        uniqueName = `${className}${counter}`;
        counter++;
      }

      classNameMap.set(shape.id, uniqueName);
      usedNames.add(uniqueName);
    });

    return classNameMap;
  }

  /**
   * Sanitize class name for mermaid (alphanumeric only, start with letter)
   */
  private sanitizeClassName(name: string): string {
    // Remove special characters and spaces
    let sanitized = name.replace(/[^a-zA-Z0-9]/g, '');

    // Ensure starts with a letter
    if (sanitized.length === 0 || /^[0-9]/.test(sanitized)) {
      sanitized = 'Class' + sanitized;
    }

    return sanitized;
  }

  /**
   * Get class definition lines for a shape
   */
  private getClassDefinition(shape: Shape, classNameMap: Map<string, string>): string[] {
    const lines: string[] = [];
    const className = classNameMap.get(shape.id) || 'Class';

    // Check if shape has class-specific data
    if (shape.data && isClassShapeData(shape.data)) {
      const classData = shape.data as ClassShapeData;

      // Add stereotype annotation if present
      if (classData.stereotype) {
        lines.push(`${this.getIndent()}class ${className} {`);
        lines.push(`${this.getIndent(2)}<<${classData.stereotype}>>`);
        lines.push(`${this.getIndent()}}`);
        lines.push('');
      }

      // Add class with attributes and methods
      lines.push(`${this.getIndent()}class ${className} {`);

      // Add attributes
      if (classData.attributes && classData.attributes.length > 0) {
        for (const attribute of classData.attributes) {
          const sanitized = this.sanitizeClassMember(attribute);
          lines.push(`${this.getIndent(2)}${sanitized}`);
        }
      }

      // Add methods
      if (classData.methods && classData.methods.length > 0) {
        for (const method of classData.methods) {
          const sanitized = this.sanitizeClassMember(method);
          lines.push(`${this.getIndent(2)}${sanitized}`);
        }
      }

      lines.push(`${this.getIndent()}}`);
    } else {
      // Simple class without attributes/methods
      lines.push(`${this.getIndent()}class ${className}`);
    }

    return lines;
  }

  /**
   * Sanitize class member (attribute or method) for mermaid
   */
  private sanitizeClassMember(member: string): string {
    // Mermaid class diagrams support visibility modifiers and type annotations
    // Format: [visibility] name [: type] [(parameters)]
    // Keep the member mostly as-is, just escape problematic characters
    return member.trim();
  }

  /**
   * Get relationship syntax between two classes
   */
  private getRelationshipSyntax(
    connector: Connector,
    sourceShape: Shape,
    targetShape: Shape,
    classNameMap: Map<string, string>
  ): string | null {
    const sourceClass = classNameMap.get(sourceShape.id);
    const targetClass = classNameMap.get(targetShape.id);

    if (!sourceClass || !targetClass) {
      return null;
    }

    // Determine relationship type based on connector properties
    const relationshipSymbol = this.getRelationshipSymbol(connector);

    // Add label if present
    const label = connector.label ? ` : ${this.sanitizeText(connector.label)}` : '';

    return `${sourceClass} ${relationshipSymbol} ${targetClass}${label}`;
  }

  /**
   * Get mermaid relationship symbol based on connector type and markers
   */
  private getRelationshipSymbol(connector: Connector): string {
    const type = connector.type;
    const markerStart = connector.markerStart || 'none';
    const markerEnd = connector.markerEnd || 'arrow';
    const lineType = connector.lineType || 'solid';

    // Realization/Implementation (dashed line with hollow triangle) - Check before plain inheritance
    if (type === 'realization' || (lineType === 'dotted' && markerEnd === 'filled-triangle')) {
      return '..|>';
    }

    // Inheritance/Generalization (hollow triangle)
    if (markerEnd === 'filled-triangle' || type === 'inheritance' || type === 'generalization') {
      return '<|--';
    }

    // Composition (filled diamond)
    if (markerEnd === 'filled-diamond' || type === 'composition') {
      return '*--';
    }

    // Aggregation (hollow diamond)
    if (markerEnd === 'diamond' || type === 'aggregation') {
      return 'o--';
    }

    // Dependency (dashed/dotted arrow)
    if (lineType === 'dotted' || type === 'dependency') {
      return '..>';
    }

    // Association (simple line)
    if (markerEnd === 'none' || type === 'association') {
      return '--';
    }

    // Directed Association (arrow)
    return '-->';
  }
}

/**
 * Factory function to create a Class diagram mermaid exporter
 */
export function createClassMermaidExporter(
  options?: MermaidExportOptions
): ClassMermaidExporter {
  return new ClassMermaidExporter(options);
}

import type { Result } from '~/core/lib/utils/result';
import type { Shape, ClassShapeData } from '~/core/entities/design-studio/types/Shape';
import type { Connector } from '~/core/entities/design-studio/types/Connector';
import type { MermaidImportOptions, MermaidImportResult } from '../mermaid-importer';
import { BaseMermaidImporter } from '../mermaid-importer';

/**
 * Parsed class information from Mermaid syntax
 */
interface ParsedClass {
  name: string;
  stereotype?: string;
  attributes: string[];
  methods: string[];
}

/**
 * Parsed relationship information from Mermaid syntax
 */
interface ParsedRelationship {
  sourceClass: string;
  targetClass: string;
  relationshipType: string;
  label?: string;
}

/**
 * Mermaid importer for Class diagrams
 * Parses Mermaid class diagram syntax back to class shapes and relationships
 */
export class ClassMermaidImporter extends BaseMermaidImporter {
  getDiagramType(): string {
    return 'class';
  }

  validate(mermaidSyntax: string): Result<void> {
    const baseValidation = super.validate(mermaidSyntax);
    if (!baseValidation.ok) {
      return baseValidation;
    }

    // Check if it's a class diagram
    const trimmed = mermaidSyntax.trim();
    if (!trimmed.startsWith('classDiagram')) {
      return {
        ok: false,
        error: 'Incorrect format for class diagram. Expected classDiagram syntax.',
      };
    }

    return { ok: true, value: undefined };
  }

  import(
    mermaidSyntax: string,
    options?: MermaidImportOptions
  ): Result<MermaidImportResult> {
    const validationResult = this.validate(mermaidSyntax);
    if (!validationResult.ok) {
      return validationResult;
    }

    try {
      const opts = this.mergeOptions(options);

      // Parse the mermaid syntax
      const parseResult = this.parseMermaidSyntax(mermaidSyntax);
      if (!parseResult.ok) {
        return parseResult;
      }

      const { classes, relationships } = parseResult.value;

      // Create ID mapping from class names to generated UUIDs
      const idMapping = new Map<string, string>();
      classes.forEach((cls) => {
        idMapping.set(cls.name, this.generateShapeId());
      });

      // Convert parsed classes to shapes with layout
      const shapes = this.createShapesWithLayout(classes, idMapping, opts);

      // Convert parsed relationships to connectors
      const connectors = this.createConnectors(relationships, idMapping);

      const result: MermaidImportResult = {
        shapes,
        connectors,
        metadata: {
          diagramType: this.getDiagramType(),
          nodeCount: shapes.length,
          edgeCount: connectors.length,
          importedAt: new Date(),
        },
      };

      return { ok: true, value: result };
    } catch (error) {
      return {
        ok: false,
        error: `Failed to import class diagram: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Parse mermaid class diagram syntax into classes and relationships
   */
  private parseMermaidSyntax(
    syntax: string
  ): Result<{ classes: ParsedClass[]; relationships: ParsedRelationship[] }> {
    try {
      const lines = syntax
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('%%')); // Remove comments

      const classes = new Map<string, ParsedClass>();
      const relationships: ParsedRelationship[] = [];

      let currentClass: ParsedClass | null = null;
      let insideClassBlock = false;

      for (const line of lines) {
        // Skip the header line
        if (line.startsWith('classDiagram')) {
          continue;
        }

        // Check if we're starting a class block
        const classBlockMatch = line.match(/^class\s+([A-Za-z0-9_]+)\s*\{/);
        if (classBlockMatch) {
          const className = classBlockMatch[1];
          if (!classes.has(className)) {
            classes.set(className, {
              name: className,
              attributes: [],
              methods: [],
            });
          }
          currentClass = classes.get(className)!;
          insideClassBlock = true;
          continue;
        }

        // Check if we're ending a class block
        if (line === '}') {
          insideClassBlock = false;
          currentClass = null;
          continue;
        }

        // Inside class block - parse members or stereotype
        if (insideClassBlock && currentClass) {
          // Check for stereotype
          if (line.startsWith('<<') && line.endsWith('>>')) {
            currentClass.stereotype = line.slice(2, -2);
            continue;
          }

          // Parse attribute or method
          const trimmedLine = line.trim();
          if (trimmedLine.length > 0) {
            // Check if it's a method (has parentheses)
            if (trimmedLine.includes('(')) {
              currentClass.methods.push(trimmedLine);
            } else {
              currentClass.attributes.push(trimmedLine);
            }
          }
          continue;
        }

        // Simple class declaration without block
        const simpleClassMatch = line.match(/^class\s+([A-Za-z0-9_]+)\s*$/);
        if (simpleClassMatch) {
          const className = simpleClassMatch[1];
          if (!classes.has(className)) {
            classes.set(className, {
              name: className,
              attributes: [],
              methods: [],
            });
          }
          continue;
        }

        // Parse relationship
        const relationshipResult = this.parseRelationshipLine(line, classes);
        if (relationshipResult) {
          relationships.push(relationshipResult);
        }
      }

      return {
        ok: true,
        value: {
          classes: Array.from(classes.values()),
          relationships,
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: `Failed to parse mermaid syntax: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Parse a relationship line (e.g., "ClassA <|-- ClassB : inherits")
   */
  private parseRelationshipLine(
    line: string,
    classes: Map<string, ParsedClass>
  ): ParsedRelationship | null {
    // Match relationship patterns
    const relationshipPatterns = [
      /^([A-Za-z0-9_]+)\s+(<\|--)\s+([A-Za-z0-9_]+)(?:\s*:\s*(.+))?$/, // Inheritance
      /^([A-Za-z0-9_]+)\s+(\.\.>\|>)\s+([A-Za-z0-9_]+)(?:\s*:\s*(.+))?$/, // Realization
      /^([A-Za-z0-9_]+)\s+(\*--)\s+([A-Za-z0-9_]+)(?:\s*:\s*(.+))?$/, // Composition
      /^([A-Za-z0-9_]+)\s+(o--)\s+([A-Za-z0-9_]+)(?:\s*:\s*(.+))?$/, // Aggregation
      /^([A-Za-z0-9_]+)\s+(\.\.>)\s+([A-Za-z0-9_]+)(?:\s*:\s*(.+))?$/, // Dependency
      /^([A-Za-z0-9_]+)\s+(-->)\s+([A-Za-z0-9_]+)(?:\s*:\s*(.+))?$/, // Directed Association
      /^([A-Za-z0-9_]+)\s+(--)\s+([A-Za-z0-9_]+)(?:\s*:\s*(.+))?$/, // Association
    ];

    for (const pattern of relationshipPatterns) {
      const match = line.match(pattern);
      if (match) {
        const sourceClass = match[1];
        const relationshipType = match[2];
        const targetClass = match[3];
        const label = match[4]?.trim();

        // Ensure both classes exist (create simple classes if they don't)
        if (!classes.has(sourceClass)) {
          classes.set(sourceClass, {
            name: sourceClass,
            attributes: [],
            methods: [],
          });
        }
        if (!classes.has(targetClass)) {
          classes.set(targetClass, {
            name: targetClass,
            attributes: [],
            methods: [],
          });
        }

        return {
          sourceClass,
          targetClass,
          relationshipType,
          label: label ? this.unsanitizeText(label) : undefined,
        };
      }
    }

    return null;
  }

  /**
   * Create shapes with simple grid layout
   */
  private createShapesWithLayout(
    classes: ParsedClass[],
    idMapping: Map<string, string>,
    options: Required<MermaidImportOptions>
  ): Shape[] {
    const shapes: Shape[] = [];
    const { horizontal, vertical } = options.nodeSpacing;

    // Simple grid layout: arrange classes in a grid pattern
    const columns = Math.ceil(Math.sqrt(classes.length));

    classes.forEach((cls, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;

      const shapeId = idMapping.get(cls.name)!;

      const x = col * horizontal;
      const y = row * vertical;

      const classData: ClassShapeData = {
        stereotype: cls.stereotype,
        attributes: cls.attributes,
        methods: cls.methods,
      };

      const shape: Shape = {
        id: shapeId,
        type: 'class',
        x,
        y,
        width: 180,
        height: 120,
        label: cls.name,
        zIndex: 1,
        locked: false,
        data: classData as unknown as Record<string, unknown>,
      };

      shapes.push(shape);
    });

    // Center all shapes around the target point
    return this.centerShapes(shapes, options.centerPoint);
  }

  /**
   * Create connectors from parsed relationships
   */
  private createConnectors(
    relationships: ParsedRelationship[],
    idMapping: Map<string, string>
  ): Connector[] {
    return relationships.map((rel) => {
      const sourceShapeId = idMapping.get(rel.sourceClass);
      const targetShapeId = idMapping.get(rel.targetClass);

      if (!sourceShapeId || !targetShapeId) {
        throw new Error(`Invalid relationship: missing class mapping`);
      }

      // Determine connector properties from relationship type
      const { type, arrowType, markerEnd, lineType } = this.getConnectorProperties(
        rel.relationshipType
      );

      const connector: Connector = {
        id: this.generateConnectorId(),
        type,
        sourceShapeId,
        targetShapeId,
        style: 'straight',
        arrowType,
        markerStart: 'none',
        markerEnd,
        lineType,
        label: rel.label,
        zIndex: 0,
      };

      return connector;
    });
  }

  /**
   * Get connector properties from Mermaid relationship symbol
   */
  private getConnectorProperties(relationshipSymbol: string): {
    type: string;
    arrowType: 'arrow' | 'none' | 'filled-triangle' | 'diamond' | 'filled-diamond';
    markerEnd: 'arrow' | 'none' | 'filled-triangle' | 'diamond' | 'filled-diamond';
    lineType: 'solid' | 'dashed' | 'dotted';
  } {
    switch (relationshipSymbol) {
      case '<|--': // Inheritance
        return {
          type: 'inheritance',
          arrowType: 'filled-triangle',
          markerEnd: 'filled-triangle',
          lineType: 'solid',
        };
      case '..|>': // Realization
        return {
          type: 'realization',
          arrowType: 'filled-triangle',
          markerEnd: 'filled-triangle',
          lineType: 'dotted',
        };
      case '*--': // Composition
        return {
          type: 'composition',
          arrowType: 'filled-diamond',
          markerEnd: 'filled-diamond',
          lineType: 'solid',
        };
      case 'o--': // Aggregation
        return {
          type: 'aggregation',
          arrowType: 'diamond',
          markerEnd: 'diamond',
          lineType: 'solid',
        };
      case '..>': // Dependency
        return {
          type: 'dependency',
          arrowType: 'arrow',
          markerEnd: 'arrow',
          lineType: 'dotted',
        };
      case '-->': // Directed Association
        return {
          type: 'association',
          arrowType: 'arrow',
          markerEnd: 'arrow',
          lineType: 'solid',
        };
      case '--': // Association
        return {
          type: 'association',
          arrowType: 'none',
          markerEnd: 'none',
          lineType: 'solid',
        };
      default:
        return {
          type: 'association',
          arrowType: 'arrow',
          markerEnd: 'arrow',
          lineType: 'solid',
        };
    }
  }
}

/**
 * Factory function to create a class diagram mermaid importer
 */
export function createClassMermaidImporter(
  _options?: MermaidImportOptions
): ClassMermaidImporter {
  return new ClassMermaidImporter();
}

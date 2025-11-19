import type { Result } from '~/core/lib/utils/result';
import type { CreateShapeDTO, ClassShapeData } from '~/core/entities/design-studio/types/Shape';
import type { MermaidImportOptions, MermaidImportResult, MermaidConnectorRef } from '../mermaid-importer';
import { BaseMermaidImporter } from '../mermaid-importer';
import { DESIGN_STUDIO_CONFIG } from '~/design-studio/config/design-studio-config';

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

      // Create index mapping from class names to array indices
      const indexMapping = new Map<string, number>();
      classes.forEach((cls, index) => {
        indexMapping.set(cls.name, index);
      });

      // Convert parsed classes to shapes with layout (no IDs)
      const shapes = this.createShapesWithLayout(classes, opts);

      // Convert parsed relationships to connector refs (using indices)
      const connectors = this.createConnectors(relationships, indexMapping);

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
   * Create shapes with simple grid layout (no IDs - they'll be generated when added to diagram)
   */
  private createShapesWithLayout(
    classes: ParsedClass[],
    options: Required<MermaidImportOptions>
  ): CreateShapeDTO[] {
    const shapes: CreateShapeDTO[] = [];
    const { horizontal, vertical } = options.nodeSpacing;

    // Simple grid layout: arrange classes in a grid pattern
    const columns = Math.ceil(Math.sqrt(classes.length));

    classes.forEach((cls, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;

      const x = col * horizontal;
      const y = row * vertical;

      const classData: ClassShapeData = {
        stereotype: cls.stereotype,
        attributes: cls.attributes,
        methods: cls.methods,
      };

      const shape: CreateShapeDTO = {
        type: 'class',
        x,
        y,
        width: DESIGN_STUDIO_CONFIG.shapes.class.classBox.width,
        height: DESIGN_STUDIO_CONFIG.shapes.class.classBox.height,
        label: cls.name,
        zIndex: 0,
        locked: false,
        isPreview: false,
        data: classData as unknown as Record<string, unknown>,
      };

      shapes.push(shape);
    });

    // Center all shapes around the target point
    return this.centerShapesDTO(shapes, options.centerPoint);
  }

  /**
   * Create connector refs from parsed relationships (using shape indices instead of IDs)
   */
  private createConnectors(
    relationships: ParsedRelationship[],
    indexMapping: Map<string, number>
  ): MermaidConnectorRef[] {
    return relationships.map((rel) => {
      const fromShapeIndex = indexMapping.get(rel.sourceClass);
      const toShapeIndex = indexMapping.get(rel.targetClass);

      if (fromShapeIndex === undefined || toShapeIndex === undefined) {
        throw new Error(`Invalid relationship: missing class mapping for ${rel.sourceClass} or ${rel.targetClass}`);
      }

      // Determine connector properties from relationship type
      const { type, lineType } = this.getConnectorProperties(rel.relationshipType);

      const connector: MermaidConnectorRef = {
        type,
        fromShapeIndex,
        toShapeIndex,
        style: 'orthogonal',
        markerStart: 'none',
        markerEnd: 'arrow',
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
    lineType: 'solid' | 'dashed' | 'dotted';
  } {
    switch (relationshipSymbol) {
      case '<|--': // Inheritance
        return {
          type: 'class-inheritance',
          lineType: 'solid',
        };
      case '..|>': // Realization
        return {
          type: 'class-realization',
          lineType: 'dashed',
        };
      case '*--': // Composition
        return {
          type: 'class-composition',
          lineType: 'solid',
        };
      case 'o--': // Aggregation
        return {
          type: 'class-aggregation',
          lineType: 'solid',
        };
      case '..>': // Dependency
        return {
          type: 'class-dependency',
          lineType: 'dotted',
        };
      case '-->': // Directed Association
        return {
          type: 'class-association',
          lineType: 'solid',
        };
      case '--': // Association
        return {
          type: 'class-association',
          lineType: 'solid',
        };
      default:
        return {
          type: 'class-association',
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

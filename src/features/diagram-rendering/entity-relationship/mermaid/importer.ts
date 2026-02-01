import type { Result } from '@/shared/lib/utils';
import type { CreateShapeDTO, EntityShapeData, EntityAttributeData } from '@/entities/shape';
import type { MermaidImportOptions, MermaidImportResult, MermaidConnectorRef } from '../../shared/mermaid/importer';
import { BaseMermaidImporter } from '../../shared/mermaid/importer';
import { CANVAS_CONFIG } from '@/shared/lib/config/canvas-config';
import type { ArrowType } from '@/entities/connector';

/**
 * Parsed entity information from Mermaid syntax
 */
interface ParsedEntity {
  name: string;
  attributes: EntityAttributeData[];
}

/**
 * Parsed relationship information from Mermaid syntax
 */
interface ParsedRelationship {
  sourceEntity: string;
  targetEntity: string;
  sourceCardinality: string;
  targetCardinality: string;
  lineType: 'solid' | 'dashed';
  label?: string;
}

/**
 * Mermaid importer for Entity Relationship diagrams
 * Parses Mermaid ER diagram syntax back to entity shapes and relationships
 */
export class EntityRelationshipMermaidImporter extends BaseMermaidImporter {
  getDiagramType(): string {
    return 'entity-relationship';
  }

  validate(mermaidSyntax: string): Result<void> {
    const baseValidation = super.validate(mermaidSyntax);
    if (!baseValidation.ok) {
      return baseValidation;
    }

    // Check if it's an ER diagram
    const trimmed = mermaidSyntax.trim();
    if (!trimmed.startsWith('erDiagram')) {
      return {
        ok: false,
        error: 'Incorrect format for ER diagram. Expected erDiagram syntax.',
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

      const { entities, relationships } = parseResult.value;

      // Create index mapping from entity names to array indices
      const indexMapping = new Map<string, number>();
      entities.forEach((entity, index) => {
        indexMapping.set(entity.name, index);
      });

      // Convert parsed entities to shapes with layout (no IDs)
      const shapes = this.createShapesWithLayout(entities, opts);

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
        error: `Failed to import ER diagram: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Parse mermaid ER diagram syntax into entities and relationships
   */
  private parseMermaidSyntax(
    syntax: string
  ): Result<{ entities: ParsedEntity[]; relationships: ParsedRelationship[] }> {
    try {
      const lines = syntax
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('%%')); // Remove comments

      const entities = new Map<string, ParsedEntity>();
      const relationships: ParsedRelationship[] = [];

      let currentEntity: ParsedEntity | null = null;
      let insideEntityBlock = false;

      for (const line of lines) {
        // Skip the header line
        if (line.startsWith('erDiagram')) {
          continue;
        }

        // Check if we're starting an entity block
        const entityBlockMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\{/);
        if (entityBlockMatch) {
          const entityName = entityBlockMatch[1];
          if (!entities.has(entityName)) {
            entities.set(entityName, {
              name: entityName,
              attributes: [],
            });
          }
          currentEntity = entities.get(entityName)!;
          insideEntityBlock = true;
          continue;
        }

        // Check if we're ending an entity block
        if (line === '}') {
          insideEntityBlock = false;
          currentEntity = null;
          continue;
        }

        // Inside entity block - parse attributes
        if (insideEntityBlock && currentEntity) {
          const attribute = this.parseAttributeLine(line);
          if (attribute) {
            currentEntity.attributes.push(attribute);
          }
          continue;
        }

        // Parse relationship
        const relationshipResult = this.parseRelationshipLine(line, entities);
        if (relationshipResult) {
          relationships.push(relationshipResult);
        }
      }

      return {
        ok: true,
        value: {
          entities: Array.from(entities.values()),
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
   * Parse an attribute line from within an entity block
   * Format: type name [PK|FK|UK] ["comment"]
   */
  private parseAttributeLine(line: string): EntityAttributeData | null {
    // Match: type name [key] ["comment"]
    // Examples:
    //   int id PK
    //   string name
    //   uuid customer_id FK "Foreign key to customer"
    const match = line.match(/^(\w+)\s+(\w+)(?:\s+(PK|FK|UK))?(?:\s+"([^"]*)")?$/);

    if (!match) {
      return null;
    }

    const attr: EntityAttributeData = {
      type: match[1],
      name: match[2],
    };

    if (match[3]) {
      attr.key = match[3] as 'PK' | 'FK' | 'UK';
    }

    if (match[4]) {
      attr.comment = match[4];
    }

    return attr;
  }

  /**
   * Parse a relationship line
   * Format: ENTITY1 ||--o{ ENTITY2 : "label"
   *
   * Cardinality markers:
   * - || : exactly one (1)
   * - o| or |o : zero or one (0..1)
   * - }| or |{ : one or more (1..*)
   * - }o or o{ : zero or more (0..*)
   */
  private parseRelationshipLine(
    line: string,
    entities: Map<string, ParsedEntity>
  ): ParsedRelationship | null {
    // Pattern for relationship with crow's foot notation
    // Source cardinality on left, target cardinality on right
    const relationshipPattern = /^([A-Za-z_][A-Za-z0-9_]*)\s+(\|o|\|\||o\||o\{|\}o|\|\{|\}\|)\s*(--|\.\.)(\|o|\|\||o\||\{o|o\{|\{|\||\}|\|\{|\}\|)\s+([A-Za-z_][A-Za-z0-9_]*)(?:\s*:\s*"?([^"]*)"?)?$/;

    const match = line.match(relationshipPattern);
    if (!match) {
      return null;
    }

    const sourceEntity = match[1];
    const sourceCardinality = match[2];
    const lineTypeSymbol = match[3];
    const targetCardinality = match[4];
    const targetEntity = match[5];
    const label = match[6]?.trim();

    // Ensure both entities exist (create simple entities if they don't)
    if (!entities.has(sourceEntity)) {
      entities.set(sourceEntity, {
        name: sourceEntity,
        attributes: [],
      });
    }
    if (!entities.has(targetEntity)) {
      entities.set(targetEntity, {
        name: targetEntity,
        attributes: [],
      });
    }

    return {
      sourceEntity,
      targetEntity,
      sourceCardinality,
      targetCardinality,
      lineType: lineTypeSymbol === '..' ? 'dashed' : 'solid',
      label: label ? this.unsanitizeText(label) : undefined,
    };
  }

  /**
   * Create shapes with simple grid layout (no IDs - they'll be generated when added to diagram)
   */
  private createShapesWithLayout(
    entities: ParsedEntity[],
    options: Required<MermaidImportOptions>
  ): CreateShapeDTO[] {
    const shapes: CreateShapeDTO[] = [];
    const { horizontal, vertical } = options.nodeSpacing;

    // Simple grid layout: arrange entities in a grid pattern
    const columns = Math.ceil(Math.sqrt(entities.length));

    entities.forEach((entity, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;

      const x = col * horizontal;
      const y = row * vertical;

      // Create entity shape
      const entityData: EntityShapeData = {
        attributes: entity.attributes,
      };

      const shape: CreateShapeDTO = {
        type: 'entity',
        x,
        y,
        width: CANVAS_CONFIG.shapes.entityRelationship.entity.width,
        height: CANVAS_CONFIG.shapes.entityRelationship.entity.height,
        label: entity.name,
        zIndex: 0,
        locked: false,
        isPreview: false,
        data: entityData,
      };

      shapes.push(shape);
    });

    // Center all shapes around the target point
    return this.centerShapesDTO(shapes, options.centerPoint);
  }

  /**
   * Convert Mermaid cardinality symbol to ArrowType
   */
  private cardinalityToArrowType(cardinality: string): ArrowType {
    // Normalize the cardinality symbol
    const normalized = cardinality.trim();

    switch (normalized) {
      case '||':
        return 'crow-one';
      case 'o|':
      case '|o':
        return 'crow-zero-one';
      case '}|':
      case '|{':
      case '}':
      case '{':
        return 'crow-many';
      case '}o':
      case 'o{':
        return 'crow-zero-many';
      default:
        return 'crow-one';
    }
  }

  /**
   * Create connector refs from parsed relationships (using shape indices instead of IDs)
   */
  private createConnectors(
    relationships: ParsedRelationship[],
    indexMapping: Map<string, number>
  ): MermaidConnectorRef[] {
    return relationships.map((rel) => {
      const fromShapeIndex = indexMapping.get(rel.sourceEntity);
      const toShapeIndex = indexMapping.get(rel.targetEntity);

      if (fromShapeIndex === undefined || toShapeIndex === undefined) {
        throw new Error(`Invalid relationship: missing entity mapping for ${rel.sourceEntity} or ${rel.targetEntity}`);
      }

      // Determine connector type based on line type
      const connectorType = rel.lineType === 'dashed'
        ? 'non-identifying-relationship'
        : 'identifying-relationship';

      const connector: MermaidConnectorRef = {
        type: connectorType,
        fromShapeIndex,
        toShapeIndex,
        style: 'orthogonal',
        markerStart: this.cardinalityToArrowType(rel.sourceCardinality),
        markerEnd: this.cardinalityToArrowType(rel.targetCardinality),
        lineType: rel.lineType,
        label: rel.label,
        zIndex: 0,
      };

      return connector;
    });
  }
}

/**
 * Factory function to create an ER diagram mermaid importer
 */
export function createEntityRelationshipMermaidImporter(
  _options?: MermaidImportOptions
): EntityRelationshipMermaidImporter {
  return new EntityRelationshipMermaidImporter();
}

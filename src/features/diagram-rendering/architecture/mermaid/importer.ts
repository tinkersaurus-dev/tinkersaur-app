import type { Result } from '@/shared/lib/utils';
import type { MermaidImportOptions, MermaidImportResult, MermaidConnectorRef, MermaidShapeRef } from '../../shared/mermaid/importer';
import { BaseMermaidImporter } from '../../shared/mermaid/importer';
import { layoutArchitectureGraph } from '../layout';
import { DEFAULT_SHAPE_SUBTYPES } from '@/features/diagram-rendering/config/shape-subtypes';

/**
 * Parsed node information from Mermaid architecture syntax
 */
interface ParsedNode {
  id: string;
  label: string;
  nodeType: 'service' | 'group';
  icon?: string;
  parent?: string;
}

/**
 * Parsed connection information from Mermaid architecture syntax
 */
interface ParsedConnection {
  sourceId: string;
  targetId: string;
  sourceDir?: string;
  targetDir?: string;
  bidirectional: boolean;
}

/**
 * Mermaid importer for Architecture diagrams
 * Parses Mermaid architecture-beta syntax back to architecture shapes and connectors
 */
export class ArchitectureMermaidImporter extends BaseMermaidImporter {
  getDiagramType(): string {
    return 'architecture';
  }

  validate(mermaidSyntax: string): Result<void> {
    const baseValidation = super.validate(mermaidSyntax);
    if (!baseValidation.ok) {
      return baseValidation;
    }

    // Check if it's an architecture diagram
    const trimmed = mermaidSyntax.trim();
    if (!trimmed.startsWith('architecture-beta')) {
      return {
        ok: false,
        error: 'Incorrect format for architecture diagram. Expected architecture-beta syntax.',
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

      const { nodes, connections } = parseResult.value;

      // Create index mapping from node IDs to array indices
      const indexMapping = new Map<string, number>();
      nodes.forEach((node, index) => {
        indexMapping.set(node.id, index);
      });

      // Convert parsed nodes to shapes with layout
      const shapes = this.createShapesWithLayout(nodes, connections, opts);

      // Convert parsed connections to connector refs (using indices)
      const connectors = this.createConnectors(connections, indexMapping);

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
        error: `Failed to import architecture diagram: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Parse mermaid architecture syntax into nodes and connections
   */
  private parseMermaidSyntax(
    syntax: string
  ): Result<{ nodes: ParsedNode[]; connections: ParsedConnection[] }> {
    try {
      const lines = syntax
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('%%')); // Remove comments

      const nodes: ParsedNode[] = [];
      const connections: ParsedConnection[] = [];

      for (const line of lines) {
        // Skip the header line
        if (line.startsWith('architecture-beta')) {
          continue;
        }

        // Try to parse as a connection line
        const connectionResult = this.parseConnectionLine(line);
        if (connectionResult) {
          connections.push(connectionResult);
          continue;
        }

        // Try to parse as a node definition
        const nodeResult = this.parseNodeDefinition(line);
        if (nodeResult) {
          nodes.push(nodeResult);
        }
      }

      return {
        ok: true,
        value: {
          nodes,
          connections,
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
   * Parse a node definition line
   * Examples:
   *   group api(cloud)[API Layer]
   *   service db(database)[Database] in api
   */
  private parseNodeDefinition(line: string): ParsedNode | null {
    // Match group pattern: group id(icon)[label] (in parent)?
    const groupMatch = line.match(/^group\s+(\w+)\((\w+)\)\[([^\]]+)\](?:\s+in\s+(\w+))?/);
    if (groupMatch) {
      return {
        id: groupMatch[1],
        label: groupMatch[3],
        nodeType: 'group',
        icon: groupMatch[2],
        parent: groupMatch[4],
      };
    }

    // Match service pattern: service id(icon)[label] (in parent)?
    const serviceMatch = line.match(/^service\s+(\w+)\((\w+)\)\[([^\]]+)\](?:\s+in\s+(\w+))?/);
    if (serviceMatch) {
      return {
        id: serviceMatch[1],
        label: serviceMatch[3],
        nodeType: 'service',
        icon: serviceMatch[2],
        parent: serviceMatch[4],
      };
    }

    return null;
  }

  /**
   * Parse a connection line
   * Examples:
   *   api:R --> L:db
   *   service1:R <--> L:service2
   */
  private parseConnectionLine(line: string): ParsedConnection | null {
    // Match pattern: source:dir arrow target:dir or source:dir arrow dir:target
    const match = line.match(/^(\w+)(?::([TBLR]))?\s+(<-->|<--|-->)\s+(?:([TBLR]):)?(\w+)/);
    if (!match) {
      return null;
    }

    const sourceId = match[1];
    const sourceDir = match[2];
    const arrow = match[3];
    const targetDir = match[4];
    const targetId = match[5];

    return {
      sourceId,
      targetId,
      sourceDir,
      targetDir,
      bidirectional: arrow === '<-->',
    };
  }

  /**
   * Create shapes with auto-layout
   * Parent-child relationships are expressed via parentIndex
   */
  private createShapesWithLayout(
    nodes: ParsedNode[],
    connections: ParsedConnection[],
    _options: MermaidImportOptions
  ): MermaidShapeRef[] {
    // Apply auto-layout algorithm
    const layoutedNodes = layoutArchitectureGraph(nodes, connections);

    // Create a mapping from node ID to index for parent lookups
    const nodeIdToIndex = new Map<string, number>();
    layoutedNodes.forEach((node, index) => {
      nodeIdToIndex.set(node.id, index);
    });

    // Convert to MermaidShapeRef (without IDs - they'll be generated on add)
    // Layout now provides width/height for all nodes (auto-sized for groups)
    return layoutedNodes.map((node) => {
      const shapeType = node.nodeType === 'group' ? 'architecture-group' : 'architecture-service';

      // Look up parent index if parent exists
      const parentIndex = node.parent ? nodeIdToIndex.get(node.parent) : undefined;

      // For services, use the icon as the subtype if provided, otherwise use the default
      // The icon field in data is kept for backwards compatibility and display purposes
      const subtype = node.nodeType === 'service'
        ? (node.icon || DEFAULT_SHAPE_SUBTYPES['architecture-service'])
        : undefined;

      return {
        type: shapeType,
        subtype,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        label: node.label,
        zIndex: 0,
        locked: false,
        isPreview: false,
        data: node.icon ? { icon: node.icon } : undefined,
        parentIndex,
      };
    });
  }

  /**
   * Create connectors from parsed connections
   */
  private createConnectors(
    connections: ParsedConnection[],
    indexMapping: Map<string, number>
  ): MermaidConnectorRef[] {
    return connections.map((conn) => {
      const sourceIndex = indexMapping.get(conn.sourceId);
      const targetIndex = indexMapping.get(conn.targetId);

      if (sourceIndex === undefined || targetIndex === undefined) {
        throw new Error(`Invalid connection: ${conn.sourceId} -> ${conn.targetId}`);
      }

      return {
        fromShapeIndex: sourceIndex,
        toShapeIndex: targetIndex,
        type: conn.bidirectional ? 'bidirectional-edge' : 'directed-edge',
        style: 'orthogonal',
        markerStart: conn.bidirectional ? 'arrow' : 'none',
        markerEnd: 'arrow',
        lineType: 'solid',
        zIndex: 0,
      };
    });
  }
}

/**
 * Factory function to create an architecture importer
 */
export function createArchitectureMermaidImporter(): ArchitectureMermaidImporter {
  return new ArchitectureMermaidImporter();
}

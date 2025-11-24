import type { Result } from '~/core/lib/utils/result';
import type { CreateShapeDTO } from '~/core/entities/design-studio/types/Shape';
import type { MermaidImportOptions, MermaidImportResult, MermaidConnectorRef } from '../mermaid-importer';
import { BaseMermaidImporter } from '../mermaid-importer';
import { layoutArchitectureGraph } from '../../layout/architecture-auto-layout';
import { DESIGN_STUDIO_CONFIG } from '~/design-studio/config/design-studio-config';

/**
 * Parsed node information from Mermaid architecture syntax
 */
interface ParsedNode {
  id: string;
  label: string;
  nodeType: 'service' | 'group' | 'junction';
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
   *   junction j1
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

    // Match junction pattern: junction id (in parent)?
    const junctionMatch = line.match(/^junction\s+(\w+)(?:\s+in\s+(\w+))?/);
    if (junctionMatch) {
      return {
        id: junctionMatch[1],
        label: '',
        nodeType: 'junction',
        parent: junctionMatch[2],
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
   */
  private createShapesWithLayout(
    nodes: ParsedNode[],
    connections: ParsedConnection[],
    _options: MermaidImportOptions
  ): CreateShapeDTO[] {
    // Apply auto-layout algorithm
    const layoutedNodes = layoutArchitectureGraph(nodes, connections);

    // Convert to CreateShapeDTO (without IDs - they'll be generated on add)
    return layoutedNodes.map((node) => {
      const config = DESIGN_STUDIO_CONFIG.shapes.architecture;

      let shapeType = 'architecture-service';
      let width: number = config.service.width;
      let height: number = config.service.height;

      if (node.nodeType === 'group') {
        shapeType = 'architecture-group';
        width = config.group.width;
        height = config.group.height;
      } else if (node.nodeType === 'junction') {
        shapeType = 'architecture-junction';
        width = config.junction.width;
        height = config.junction.height;
      }

      return {
        type: shapeType,
        x: node.x,
        y: node.y,
        width,
        height,
        label: node.label,
        zIndex: 0,
        locked: false,
        isPreview: false,
        data: node.icon ? { icon: node.icon } : undefined,
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

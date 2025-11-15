import type { Result } from '~/core/lib/utils/result';
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Connector } from '~/core/entities/design-studio/types/Connector';
import type { MermaidImportOptions, MermaidImportResult } from '../mermaid-importer';
import { BaseMermaidImporter } from '../mermaid-importer';

/**
 * Parsed node information from Mermaid syntax
 */
interface ParsedNode {
  id: string;
  label: string;
  shapeType: string;
  subtype: string;
  mermaidShape: string;
}

/**
 * Parsed connection information from Mermaid syntax
 */
interface ParsedConnection {
  sourceId: string;
  targetId: string;
  label?: string;
  lineType: 'solid' | 'dashed' | 'dotted';
  markerEnd: 'arrow' | 'none';
}

/**
 * Mermaid importer for BPMN diagrams
 * Parses Mermaid flowchart syntax back to BPMN shapes and connectors
 */
export class BpmnMermaidImporter extends BaseMermaidImporter {
  getDiagramType(): string {
    return 'bpmn';
  }

  validate(mermaidSyntax: string): Result<void> {
    const baseValidation = super.validate(mermaidSyntax);
    if (!baseValidation.ok) {
      return baseValidation;
    }

    // Check if it's a flowchart diagram
    const trimmed = mermaidSyntax.trim();
    if (!trimmed.startsWith('flowchart') && !trimmed.startsWith('graph')) {
      return {
        ok: false,
        error: 'Incorrect format for BPMN diagram. Expected flowchart syntax.',
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

      // Create ID mapping from alphabetic IDs to generated UUIDs
      const idMapping = new Map<string, string>();
      nodes.forEach((node) => {
        idMapping.set(node.id, this.generateShapeId());
      });

      // Convert parsed nodes to shapes with layout
      const shapes = this.createShapesWithLayout(nodes, idMapping, opts);

      // Convert parsed connections to connectors
      const connectors = this.createConnectors(connections, idMapping);

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
        error: `Failed to import BPMN diagram: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Parse mermaid flowchart syntax into nodes and connections
   */
  private parseMermaidSyntax(
    syntax: string
  ): Result<{ nodes: ParsedNode[]; connections: ParsedConnection[] }> {
    try {
      const lines = syntax
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('%%')); // Remove comments

      const nodes = new Map<string, ParsedNode>();
      const connections: ParsedConnection[] = [];

      for (const line of lines) {
        // Skip the header line
        if (line.startsWith('flowchart') || line.startsWith('graph')) {
          continue;
        }

        // Try to parse as a connection line
        const connectionResult = this.parseConnectionLine(line);
        if (connectionResult) {
          connections.push(connectionResult.connection);

          // Add nodes from connection if not already added
          if (!nodes.has(connectionResult.sourceNode.id)) {
            nodes.set(connectionResult.sourceNode.id, connectionResult.sourceNode);
          }
          if (!nodes.has(connectionResult.targetNode.id)) {
            nodes.set(connectionResult.targetNode.id, connectionResult.targetNode);
          }
          continue;
        }

        // Try to parse as a standalone node
        const nodeResult = this.parseNodeDefinition(line);
        if (nodeResult && !nodes.has(nodeResult.id)) {
          nodes.set(nodeResult.id, nodeResult);
        }
      }

      return {
        ok: true,
        value: {
          nodes: Array.from(nodes.values()),
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
   * Parse a connection line (e.g., "A[Task] --> B[Process]")
   */
  private parseConnectionLine(line: string): {
    sourceNode: ParsedNode;
    targetNode: ParsedNode;
    connection: ParsedConnection;
  } | null {
    // Match patterns like: nodeA --> nodeB, nodeA -.-> nodeB, nodeA --- nodeB, etc.
    // Also match with labels: nodeA -->|label| nodeB
    const connectionPattern =
      /^(.+?)\s+(-->|---|-.->|-\.-|\|.+?\|)\s*(-->|---|-.->|-\.-|\|.+?\|)?\s*(.+)$/;
    const match = line.match(connectionPattern);

    if (!match) {
      return null;
    }

    const sourceNodeStr = match[1].trim();
    const arrow1 = match[2].trim();
    const arrow2OrLabel = match[3]?.trim() || '';
    const targetNodeStr = match[4].trim();

    // Handle case with label: A --> |label| B
    let label: string | undefined;
    let arrowSyntax = arrow1;

    if (arrow1.startsWith('|') && arrow1.endsWith('|')) {
      // First part is label, second part is arrow
      label = this.removeQuotes(arrow1.slice(1, -1));
      arrowSyntax = arrow2OrLabel;
    } else if (arrow2OrLabel.startsWith('|') && arrow2OrLabel.endsWith('|')) {
      // Second part is label
      label = this.removeQuotes(arrow2OrLabel.slice(1, -1));
    }

    const sourceNode = this.parseNodeDefinition(sourceNodeStr);
    const targetNode = this.parseNodeDefinition(targetNodeStr);

    if (!sourceNode || !targetNode) {
      return null;
    }

    // Determine line type and marker from arrow syntax
    let lineType: 'solid' | 'dashed' | 'dotted' = 'solid';
    let markerEnd: 'arrow' | 'none' = 'arrow';

    if (arrowSyntax.includes('-.')) {
      lineType = 'dashed';
    }

    if (!arrowSyntax.includes('>')) {
      markerEnd = 'none';
    }

    return {
      sourceNode,
      targetNode,
      connection: {
        sourceId: sourceNode.id,
        targetId: targetNode.id,
        label: label ? this.unsanitizeText(label) : undefined,
        lineType,
        markerEnd,
      },
    };
  }

  /**
   * Parse a node definition (e.g., "A[Task]", "B((Start))", "C{Gateway}")
   */
  private parseNodeDefinition(nodeStr: string): ParsedNode | null {
    // Pattern: nodeId[label], nodeId((label)), nodeId{label}, nodeId(((label))), nodeId("label")
    const patterns = [
      /^([A-Za-z0-9_]+)\[\s*"?([^"\]]*)"?\s*\]$/, // Rectangle [label]
      /^([A-Za-z0-9_]+)\(\(\(\s*"?([^"]*)"?\s*\)\)\)$/, // Triple circle (((label)))
      /^([A-Za-z0-9_]+)\(\(\s*"?([^"]*)"?\s*\)\)$/, // Circle ((label))
      /^([A-Za-z0-9_]+)\{\s*"?([^"}]*)"?\s*\}$/, // Diamond {label}
      /^([A-Za-z0-9_]+)\(\s*"?([^"]*)"?\s*\)$/, // Rounded rect (label)
    ];

    for (let i = 0; i < patterns.length; i++) {
      const match = nodeStr.match(patterns[i]);
      if (match) {
        const id = match[1];
        const label = this.removeQuotes(match[2]).trim();

        const { shapeType, subtype, mermaidShape } = this.inferShapeType(nodeStr, label);

        return {
          id,
          label: this.unsanitizeText(label),
          shapeType,
          subtype,
          mermaidShape,
        };
      }
    }

    return null;
  }

  /**
   * Infer BPMN shape type and subtype from mermaid shape syntax
   */
  private inferShapeType(
    mermaidShape: string,
    label: string
  ): { shapeType: string; subtype: string; mermaidShape: string } {
    // Triple circle ((())) - End event
    if (mermaidShape.includes('(((') && mermaidShape.includes(')))')) {
      return { shapeType: 'bpmn-event', subtype: 'end', mermaidShape: 'triple-circle' };
    }

    // Double circle (()) - Start event or intermediate event
    if (mermaidShape.includes('((') && mermaidShape.includes('))')) {
      // Infer from label if possible
      const lowerLabel = label.toLowerCase();
      if (lowerLabel.includes('start')) {
        return { shapeType: 'bpmn-event', subtype: 'start', mermaidShape: 'circle' };
      }
      if (lowerLabel.includes('end')) {
        return { shapeType: 'bpmn-event', subtype: 'end', mermaidShape: 'circle' };
      }
      // Default to start event
      return { shapeType: 'bpmn-event', subtype: 'start', mermaidShape: 'circle' };
    }

    // Diamond {} - Gateway
    if (mermaidShape.includes('{') && mermaidShape.includes('}')) {
      return { shapeType: 'bpmn-gateway', subtype: 'exclusive', mermaidShape: 'diamond' };
    }

    // Rounded rectangle () - Sub-process
    if (
      mermaidShape.includes('(') &&
      mermaidShape.includes(')') &&
      !mermaidShape.includes('((')
    ) {
      return {
        shapeType: 'bpmn-subprocess',
        subtype: 'subprocess',
        mermaidShape: 'rounded-rect',
      };
    }

    // Square brackets [] - Task (default)
    return { shapeType: 'bpmn-task', subtype: 'task', mermaidShape: 'rectangle' };
  }

  /**
   * Create shapes with simple grid layout
   */
  private createShapesWithLayout(
    nodes: ParsedNode[],
    idMapping: Map<string, string>,
    options: Required<MermaidImportOptions>
  ): Shape[] {
    const shapes: Shape[] = [];
    const { horizontal, vertical } = options.nodeSpacing;

    // Simple grid layout: arrange nodes in a grid pattern
    const columns = Math.ceil(Math.sqrt(nodes.length));

    nodes.forEach((node, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;

      const shapeId = idMapping.get(node.id)!;

      // Determine dimensions based on shape type
      let width = options.defaultShapeDimensions.width;
      let height = options.defaultShapeDimensions.height;

      if (node.shapeType === 'bpmn-event') {
        width = 40;
        height = 40;
      } else if (node.shapeType === 'bpmn-gateway') {
        width = 60;
        height = 60;
      } else if (node.shapeType === 'bpmn-task') {
        width = 120;
        height = 80;
      }

      const x = col * horizontal;
      const y = row * vertical;

      const shape: Shape = {
        id: shapeId,
        type: node.shapeType,
        subtype: node.subtype,
        x,
        y,
        width,
        height,
        label: node.label,
        zIndex: 1,
        locked: false,
      };

      shapes.push(shape);
    });

    // Center all shapes around the target point
    return this.centerShapes(shapes, options.centerPoint);
  }

  /**
   * Create connectors from parsed connections
   */
  private createConnectors(
    connections: ParsedConnection[],
    idMapping: Map<string, string>
  ): Connector[] {
    return connections.map((conn) => {
      const sourceShapeId = idMapping.get(conn.sourceId);
      const targetShapeId = idMapping.get(conn.targetId);

      if (!sourceShapeId || !targetShapeId) {
        throw new Error(`Invalid connection: missing shape ID mapping`);
      }

      const connector: Connector = {
        id: this.generateConnectorId(),
        type: 'arrow',
        sourceShapeId,
        targetShapeId,
        style: 'straight',
        arrowType: conn.markerEnd,
        markerStart: 'none',
        markerEnd: conn.markerEnd,
        lineType: conn.lineType,
        label: conn.label,
        zIndex: 0,
      };

      return connector;
    });
  }
}

/**
 * Factory function to create a BPMN mermaid importer
 */
export function createBpmnMermaidImporter(
  _options?: MermaidImportOptions
): BpmnMermaidImporter {
  return new BpmnMermaidImporter();
}

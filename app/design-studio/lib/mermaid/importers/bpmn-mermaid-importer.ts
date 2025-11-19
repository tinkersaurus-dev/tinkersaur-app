import type { Result } from '~/core/lib/utils/result';
import type { CreateShapeDTO } from '~/core/entities/design-studio/types/Shape';
import type { MermaidImportOptions, MermaidImportResult, MermaidConnectorRef } from '../mermaid-importer';
import { BaseMermaidImporter } from '../mermaid-importer';
import { layoutBpmnGraph } from '../../layout/bpmn-auto-layout';
import { DESIGN_STUDIO_CONFIG } from '~/design-studio/config/design-studio-config';

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

      // Create index mapping from node IDs to array indices
      const indexMapping = new Map<string, number>();
      nodes.forEach((node, index) => {
        indexMapping.set(node.id, index);
      });

      // Convert parsed nodes to shapes with layout (no IDs)
      // Pass connections to the layout method
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
   * Create shapes with flow-based auto-layout (no IDs - they'll be generated when added to diagram)
   */
  private createShapesWithLayout(
    nodes: ParsedNode[],
    connections: ParsedConnection[],
    options: Required<MermaidImportOptions>
  ): CreateShapeDTO[] {
    const { horizontal, vertical } = options.nodeSpacing;

    // Prepare nodes with dimensions for layout algorithm
    const layoutNodes = nodes.map((node) => {
      // Determine dimensions based on shape type
      let width = options.defaultShapeDimensions.width;
      let height = options.defaultShapeDimensions.height;

      if (node.shapeType === 'bpmn-event') {
        width = DESIGN_STUDIO_CONFIG.shapes.bpmn.startEvent.width;
        height = DESIGN_STUDIO_CONFIG.shapes.bpmn.startEvent.height;
      } else if (node.shapeType === 'bpmn-gateway') {
        width = DESIGN_STUDIO_CONFIG.shapes.bpmn.gateway.width;
        height = DESIGN_STUDIO_CONFIG.shapes.bpmn.gateway.height;
      } else if (node.shapeType === 'bpmn-task') {
        width = DESIGN_STUDIO_CONFIG.shapes.bpmn.task.width;
        height = DESIGN_STUDIO_CONFIG.shapes.bpmn.task.height;
      }

      return {
        id: node.id,
        type: node.shapeType,
        subtype: node.subtype,
        width,
        height,
        label: node.label,
      };
    });

    // Apply auto-layout algorithm
    const positions = layoutBpmnGraph(layoutNodes, connections, {
      horizontalSpacing: horizontal,
      verticalSpacing: vertical,
    });

    // Create shape DTOs with calculated positions
    const shapes: CreateShapeDTO[] = nodes.map((node) => {
      const position = positions.find((p) => p.id === node.id);
      const layoutNode = layoutNodes.find((n) => n.id === node.id);

      if (!position || !layoutNode) {
        throw new Error(`Failed to calculate position for node ${node.id}`);
      }

      const shape: CreateShapeDTO = {
        type: node.shapeType,
        subtype: node.subtype,
        x: position.x,
        y: position.y,
        width: layoutNode.width,
        height: layoutNode.height,
        label: node.label,
        zIndex: 0,
        locked: false,
        isPreview: false,
      };

      return shape;
    });

    // Center all shapes around the target point
    return this.centerShapesDTO(shapes, options.centerPoint);
  }

  /**
   * Create connector refs from parsed connections (using shape indices instead of IDs)
   */
  private createConnectors(
    connections: ParsedConnection[],
    indexMapping: Map<string, number>
  ): MermaidConnectorRef[] {
    return connections.map((conn) => {
      const fromShapeIndex = indexMapping.get(conn.sourceId);
      const toShapeIndex = indexMapping.get(conn.targetId);

      if (fromShapeIndex === undefined || toShapeIndex === undefined) {
        throw new Error(`Invalid connection: missing shape mapping for ${conn.sourceId} or ${conn.targetId}`);
      }

      const connector: MermaidConnectorRef = {
        type: 'bpmn-sequence-flow',
        fromShapeIndex,
        toShapeIndex,
        style: 'orthogonal',
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

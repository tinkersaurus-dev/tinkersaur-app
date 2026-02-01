import type { Result } from '@/shared/lib/utils';
import type { CreateShapeDTO } from '@/entities/shape';
import type { MermaidImportOptions, MermaidImportResult, MermaidConnectorRef } from '../../shared/mermaid/importer';
import { BaseMermaidImporter } from '../../shared/mermaid/importer';
import { layoutBpmnGraph } from '../layout';
import { DESIGN_STUDIO_CONFIG } from '@/shared/config/design-studio';
import { DEFAULT_SHAPE_SUBTYPES, getBpmnEventSubtype } from '@/features/diagram-rendering/config/shape-subtypes';

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
    // Match patterns like:
    // nodeA --> nodeB
    // nodeA -.-> nodeB
    // nodeA --- nodeB
    // nodeA -->|label| nodeB
    // Also handles inline node definitions like: A --> B{"Label"}

    // First, try to match with label: nodeA -->|label| nodeB
    const labeledPattern = /^(.+?)\s+(-->|---|-\.->|-\.-)\s*\|([^|]+)\|\s*(.+)$/;
    let match = line.match(labeledPattern);

    let sourceNodeStr: string;
    let targetNodeStr: string;
    let label: string | undefined;
    let arrowSyntax: string;

    if (match) {
      sourceNodeStr = match[1].trim();
      arrowSyntax = match[2].trim();
      label = this.removeQuotes(match[3].trim());
      targetNodeStr = match[4].trim();
    } else {
      // Try to match without label: nodeA --> nodeB
      const simplePattern = /^(.+?)\s+(-->|---|-\.->|-\.-)\s+(.+)$/;
      match = line.match(simplePattern);

      if (!match) {
        return null;
      }

      sourceNodeStr = match[1].trim();
      arrowSyntax = match[2].trim();
      targetNodeStr = match[3].trim();
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
    // Updated patterns to handle quoted labels with special characters
    const patterns = [
      /^([A-Za-z0-9_]+)\[\s*"([^"]*)"\s*\]$/, // Rectangle ["label"] with quotes
      /^([A-Za-z0-9_]+)\[\s*([^\]]*)\s*\]$/, // Rectangle [label] without quotes
      /^([A-Za-z0-9_]+)\(\(\(\s*"?([^")]*)"?\s*\)\)\)$/, // Triple circle (((label)))
      /^([A-Za-z0-9_]+)\(\(\s*"?([^")]*)"?\s*\)\)$/, // Circle ((label))
      /^([A-Za-z0-9_]+)\{\s*"([^"]*)"\s*\}$/, // Diamond {"label"} with quotes
      /^([A-Za-z0-9_]+)\{\s*([^}]*)\s*\}$/, // Diamond {label} without quotes
      /^([A-Za-z0-9_]+)\(\s*"?([^")]*)"?\s*\)$/, // Rounded rect (label)
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

    // Handle simple node IDs without shape definition (e.g., just "A")
    // This can happen when a node is referenced in a connection before being defined
    const simpleIdMatch = nodeStr.match(/^([A-Za-z0-9_]+)$/);
    if (simpleIdMatch) {
      return {
        id: simpleIdMatch[1],
        label: simpleIdMatch[1], // Use the ID as the label
        shapeType: 'bpmn-task',
        subtype: DEFAULT_SHAPE_SUBTYPES['bpmn-task'],
        mermaidShape: 'rectangle',
      };
    }

    return null;
  }

  /**
   * Infer BPMN shape type and subtype from mermaid shape syntax.
   * Note: For events, the subtype is a placeholder that will be refined
   * by position-based logic in createShapesWithLayout.
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
      // Default to start event (will be refined by position-based logic)
      return { shapeType: 'bpmn-event', subtype: DEFAULT_SHAPE_SUBTYPES['bpmn-event'], mermaidShape: 'circle' };
    }

    // Diamond {} - Gateway (default to exclusive)
    if (mermaidShape.includes('{') && mermaidShape.includes('}')) {
      return { shapeType: 'bpmn-gateway', subtype: DEFAULT_SHAPE_SUBTYPES['bpmn-gateway'], mermaidShape: 'diamond' };
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

    // Square brackets [] - Task (default to user task)
    return { shapeType: 'bpmn-task', subtype: DEFAULT_SHAPE_SUBTYPES['bpmn-task'], mermaidShape: 'rectangle' };
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

    // Determine first and last nodes in the flow for position-based event subtype logic
    const { firstNodes, lastNodes } = this.findTerminalNodes(nodes, connections);

    // Prepare nodes with dimensions for layout algorithm
    const layoutNodes = nodes.map((node) => {
      // Determine dimensions based on shape type
      let width = options.defaultShapeDimensions.width;
      let height = options.defaultShapeDimensions.height;

      // Determine subtype for events using position-based logic
      let subtype = node.subtype;
      if (node.shapeType === 'bpmn-event' && !['start', 'end'].includes(node.subtype)) {
        // Only override if the subtype wasn't explicitly determined from mermaid shape
        const isFirst = firstNodes.has(node.id);
        const isLast = lastNodes.has(node.id);
        subtype = getBpmnEventSubtype(isFirst, isLast);
      }

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
        subtype,
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
    const shapes: CreateShapeDTO[] = layoutNodes.map((layoutNode) => {
      const position = positions.find((p) => p.id === layoutNode.id);
      const originalNode = nodes.find((n) => n.id === layoutNode.id);

      if (!position || !originalNode) {
        throw new Error(`Failed to calculate position for node ${layoutNode.id}`);
      }

      const shape: CreateShapeDTO = {
        type: layoutNode.type,
        subtype: layoutNode.subtype,
        x: position.x,
        y: position.y,
        width: layoutNode.width,
        height: layoutNode.height,
        label: layoutNode.label,
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
   * Find terminal nodes (nodes with no incoming or no outgoing connections)
   * Used to determine start/end events by position in the flow
   */
  private findTerminalNodes(
    nodes: ParsedNode[],
    connections: ParsedConnection[]
  ): { firstNodes: Set<string>; lastNodes: Set<string> } {
    const nodeIds = new Set(nodes.map((n) => n.id));
    const hasIncoming = new Set<string>();
    const hasOutgoing = new Set<string>();

    for (const conn of connections) {
      if (nodeIds.has(conn.targetId)) {
        hasIncoming.add(conn.targetId);
      }
      if (nodeIds.has(conn.sourceId)) {
        hasOutgoing.add(conn.sourceId);
      }
    }

    // First nodes: have no incoming connections
    const firstNodes = new Set<string>();
    // Last nodes: have no outgoing connections
    const lastNodes = new Set<string>();

    for (const node of nodes) {
      if (!hasIncoming.has(node.id)) {
        firstNodes.add(node.id);
      }
      if (!hasOutgoing.has(node.id)) {
        lastNodes.add(node.id);
      }
    }

    return { firstNodes, lastNodes };
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

/**
 * BPMN Auto-Layout Algorithm
 *
 * Arranges BPMN shapes in a flow-based layout:
 * - Main flow continues left-to-right on the same row
 * - At gateways, longer branch continues on current row
 * - Shorter branches move to next row down
 * - Nested branches continue the pattern (always go down)
 */

interface LayoutNode {
  id: string;
  type: string;
  subtype?: string;
  width: number;
  height: number;
  label?: string;
}

interface LayoutConnection {
  sourceId: string;
  targetId: string;
}

interface PositionedNode {
  id: string;
  x: number;
  y: number;
}

interface LayoutOptions {
  horizontalSpacing: number;  // Spacing between shapes on same row
  verticalSpacing: number;    // Spacing between rows
}

interface AdjacencyGraph {
  outgoing: Map<string, string[]>;  // node -> [target nodes]
  incoming: Map<string, string[]>;  // node -> [source nodes]
}

/**
 * Build adjacency graph from connections
 */
function buildGraph(connections: LayoutConnection[]): AdjacencyGraph {
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();

  for (const conn of connections) {
    // Outgoing edges
    if (!outgoing.has(conn.sourceId)) {
      outgoing.set(conn.sourceId, []);
    }
    outgoing.get(conn.sourceId)!.push(conn.targetId);

    // Incoming edges
    if (!incoming.has(conn.targetId)) {
      incoming.set(conn.targetId, []);
    }
    incoming.get(conn.targetId)!.push(conn.sourceId);
  }

  return { outgoing, incoming };
}

/**
 * Find start nodes (nodes with no incoming connections, prefer start events)
 */
function findStartNodes(nodes: LayoutNode[], graph: AdjacencyGraph): string[] {
  const startNodes = nodes
    .filter(node => !graph.incoming.has(node.id) || graph.incoming.get(node.id)!.length === 0)
    .map(node => node.id);

  if (startNodes.length === 0 && nodes.length > 0) {
    // Fallback: if no start nodes found (cycle), use first node
    return [nodes[0].id];
  }

  // Sort to prioritize start events
  return startNodes.sort((a, b) => {
    const nodeA = nodes.find(n => n.id === a);
    const nodeB = nodes.find(n => n.id === b);
    if (nodeA?.type === 'bpmn-event' && nodeA?.subtype === 'start') return -1;
    if (nodeB?.type === 'bpmn-event' && nodeB?.subtype === 'start') return 1;
    return 0;
  });
}

/**
 * Calculate the total number of nodes reachable from a given node
 */
function calculateBranchLength(
  startNodeId: string,
  graph: AdjacencyGraph,
  visited: Set<string> = new Set()
): number {
  if (visited.has(startNodeId)) {
    return 0; // Avoid infinite loops
  }

  visited.add(startNodeId);
  let count = 1; // Count the current node

  const targets = graph.outgoing.get(startNodeId) || [];
  for (const targetId of targets) {
    count += calculateBranchLength(targetId, graph, new Set(visited));
  }

  return count;
}

/**
 * Layout nodes using flow-based algorithm
 */
export function layoutBpmnGraph(
  nodes: LayoutNode[],
  connections: LayoutConnection[],
  options: LayoutOptions
): PositionedNode[] {
  if (nodes.length === 0) {
    return [];
  }

  const graph = buildGraph(connections);
  const startNodeIds = findStartNodes(nodes, graph);

  const positions = new Map<string, PositionedNode>();
  const processed = new Set<string>();

  // Track current X position for each row
  const rowXPositions = new Map<number, number>();

  /**
   * Layout a node and its descendants
   * @param nodeId - Node to layout
   * @param row - Row number for this node
   * @param isMainBranch - Whether this is the main/continuing branch
   */
  function layoutNode(nodeId: string, row: number, isMainBranch: boolean = true): void {
    if (processed.has(nodeId)) {
      return; // Already processed (can happen with converging flows)
    }

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    processed.add(nodeId);

    // Get or initialize X position for this row
    if (!rowXPositions.has(row)) {
      rowXPositions.set(row, 0);
    }
    const x = rowXPositions.get(row)!;

    // Calculate Y position for this row (simple row-based spacing)
    const y = row * options.verticalSpacing;

    // Store position (top-left corner of shape)
    positions.set(nodeId, { id: nodeId, x, y });

    // Advance X position for this row
    rowXPositions.set(row, x + node.width + options.horizontalSpacing);

    // Process outgoing connections
    const targets = graph.outgoing.get(nodeId) || [];

    if (targets.length === 0) {
      // End node, nothing more to do
      return;
    }

    if (targets.length === 1) {
      // Single target: continue on same row
      layoutNode(targets[0], row, isMainBranch);
    } else {
      // Gateway: multiple targets (branches)
      // Capture X position right after gateway (before processing branches)
      const gatewayBranchStartX = rowXPositions.get(row)!;

      // Calculate branch lengths to determine which is the main branch
      const branchLengths = targets.map(targetId => ({
        targetId,
        length: calculateBranchLength(targetId, graph, new Set(processed))
      }));

      // Sort by length (descending) - longest branch continues on current row
      branchLengths.sort((a, b) => b.length - a.length);

      // Layout the longest branch first (continues on current row)
      layoutNode(branchLengths[0].targetId, row, true);

      // Layout other branches on new rows below
      // Important: Start each branch at the position right after the gateway
      for (let i = 1; i < branchLengths.length; i++) {
        const newRow = row + i;
        // Set branch to start at the same X position as the main branch
        // (right after the gateway that spawned them)
        rowXPositions.set(newRow, gatewayBranchStartX);
        layoutNode(branchLengths[i].targetId, newRow, false);
      }
    }
  }

  // Layout from each start node
  startNodeIds.forEach((startId, index) => {
    if (index === 0) {
      // First start node goes on row 0
      layoutNode(startId, 0, true);
    } else {
      // Additional start nodes go on new rows
      const newRow = Math.max(...Array.from(rowXPositions.keys())) + 1;
      layoutNode(startId, newRow, true);
    }
  });

  // Handle any unprocessed nodes (disconnected components)
  const unprocessed = nodes.filter(n => !processed.has(n.id));
  if (unprocessed.length > 0) {
    const maxRow = Math.max(...Array.from(rowXPositions.keys()));
    unprocessed.forEach((node, index) => {
      const row = maxRow + index + 1;
      rowXPositions.set(row, 0);
      layoutNode(node.id, row, true);
    });
  }

  // Apply vertical centering for shapes in each row
  return applyCenterAlignment(nodes, Array.from(positions.values()));
}

/**
 * Center-align shapes vertically within their rows
 */
function applyCenterAlignment(
  nodes: LayoutNode[],
  positions: PositionedNode[]
): PositionedNode[] {
  // Group positions by row (nodes with same/similar Y)
  const rowGroups = new Map<number, PositionedNode[]>();

  positions.forEach(pos => {
    const roundedY = Math.round(pos.y / 10) * 10; // Group by 10px tolerance
    if (!rowGroups.has(roundedY)) {
      rowGroups.set(roundedY, []);
    }
    rowGroups.get(roundedY)!.push(pos);
  });

  // For each row, find max height and center all shapes
  rowGroups.forEach((rowPositions, baseY) => {
    const maxHeight = Math.max(
      ...rowPositions.map(pos => {
        const node = nodes.find(n => n.id === pos.id);
        return node?.height || 0;
      })
    );

    rowPositions.forEach(pos => {
      const node = nodes.find(n => n.id === pos.id);
      if (node) {
        // Center vertically within the row
        const verticalOffset = (maxHeight - node.height) / 2;
        pos.y = baseY + verticalOffset;
      }
    });
  });

  return positions;
}

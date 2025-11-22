/**
 * Architecture Diagram Auto-Layout Algorithm
 *
 * Positions architecture diagram nodes (services, groups, junctions)
 * in a hierarchical left-to-right layout.
 */

interface LayoutNode {
  id: string;
  label: string;
  nodeType: 'service' | 'group' | 'junction';
  icon?: string;
  parent?: string;
  x: number;
  y: number;
}

interface LayoutConnection {
  sourceId: string;
  targetId: string;
  sourceDir?: string;
  targetDir?: string;
  bidirectional: boolean;
}

interface ParsedNode {
  id: string;
  label: string;
  nodeType: 'service' | 'group' | 'junction';
  icon?: string;
  parent?: string;
}

/**
 * Layout architecture graph using a hierarchical approach
 */
export function layoutArchitectureGraph(
  nodes: ParsedNode[],
  connections: LayoutConnection[]
): LayoutNode[] {
  if (nodes.length === 0) {
    return [];
  }

  // Build adjacency list for connections
  const adjacencyList = new Map<string, Set<string>>();
  nodes.forEach((node) => adjacencyList.set(node.id, new Set()));

  connections.forEach((conn) => {
    adjacencyList.get(conn.sourceId)?.add(conn.targetId);
    if (conn.bidirectional) {
      adjacencyList.get(conn.targetId)?.add(conn.sourceId);
    }
  });

  // Calculate node ranks (layers)
  const ranks = calculateRanks(nodes, connections, adjacencyList);

  // Group nodes by rank
  const nodesByRank = new Map<number, ParsedNode[]>();
  nodes.forEach((node) => {
    const rank = ranks.get(node.id) || 0;
    if (!nodesByRank.has(rank)) {
      nodesByRank.set(rank, []);
    }
    nodesByRank.get(rank)!.push(node);
  });

  // Layout configuration
  const horizontalSpacing = 200;
  const verticalSpacing = 150;
  const startX = 100;
  const startY = 100;

  // Position nodes by rank
  const layoutedNodes: LayoutNode[] = [];
  const maxRank = Math.max(...Array.from(nodesByRank.keys()));

  for (let rank = 0; rank <= maxRank; rank++) {
    const nodesInRank = nodesByRank.get(rank) || [];
    const x = startX + rank * horizontalSpacing;

    nodesInRank.forEach((node, index) => {
      const y = startY + index * verticalSpacing;

      layoutedNodes.push({
        ...node,
        x,
        y,
      });
    });
  }

  return layoutedNodes;
}

/**
 * Calculate ranks (layers) for nodes using topological ordering
 */
function calculateRanks(
  nodes: ParsedNode[],
  connections: LayoutConnection[],
  adjacencyList: Map<string, Set<string>>
): Map<string, number> {
  const ranks = new Map<string, number>();
  const inDegree = new Map<string, number>();

  // Initialize in-degrees
  nodes.forEach((node) => inDegree.set(node.id, 0));

  // Calculate in-degrees
  connections.forEach((conn) => {
    const currentDegree = inDegree.get(conn.targetId) || 0;
    inDegree.set(conn.targetId, currentDegree + 1);
  });

  // Find source nodes (nodes with no incoming edges)
  const queue: string[] = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
      ranks.set(nodeId, 0);
    }
  });

  // Process nodes in topological order
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentRank = ranks.get(currentId) || 0;

    const neighbors = adjacencyList.get(currentId) || new Set();
    neighbors.forEach((neighborId) => {
      // Update rank
      const neighborRank = ranks.get(neighborId) || 0;
      ranks.set(neighborId, Math.max(neighborRank, currentRank + 1));

      // Decrease in-degree
      const degree = inDegree.get(neighborId) || 0;
      inDegree.set(neighborId, degree - 1);

      // Add to queue if all incoming edges processed
      if (degree - 1 === 0) {
        queue.push(neighborId);
      }
    });
  }

  // Assign rank 0 to nodes not yet ranked (disconnected nodes)
  nodes.forEach((node) => {
    if (!ranks.has(node.id)) {
      ranks.set(node.id, 0);
    }
  });

  return ranks;
}

/**
 * Center the layout around the origin
 */
export function centerLayout(nodes: LayoutNode[]): LayoutNode[] {
  if (nodes.length === 0) {
    return [];
  }

  // Calculate bounding box
  const minX = Math.min(...nodes.map((n) => n.x));
  const maxX = Math.max(...nodes.map((n) => n.x));
  const minY = Math.min(...nodes.map((n) => n.y));
  const maxY = Math.max(...nodes.map((n) => n.y));

  // Calculate center offset
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // Center nodes
  return nodes.map((node) => ({
    ...node,
    x: node.x - centerX,
    y: node.y - centerY,
  }));
}

/**
 * Architecture Diagram Auto-Layout Algorithm
 *
 * Positions architecture diagram nodes (services, groups)
 * with the following rules:
 * - Top-level groups are arranged horizontally with spacing between edges
 * - Groups auto-size to fit their contained children
 * - Children within groups are arranged in a grid (max 3 columns)
 * - Nested groups follow the same grid pattern as services
 * - Orphan services (no parent) appear below the groups
 * - Order is preserved from the mermaid syntax (input array order)
 */

import { DESIGN_STUDIO_CONFIG } from '@/shared/config/design-studio';

export interface LayoutNode {
  id: string;
  label: string;
  nodeType: 'service' | 'group';
  icon?: string;
  parent?: string;
  x: number;
  y: number;
  width: number;
  height: number;
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
  nodeType: 'service' | 'group';
  icon?: string;
  parent?: string;
}

interface SizedNode extends ParsedNode {
  width: number;
  height: number;
}

interface LayoutResult {
  nodes: LayoutNode[];
  width: number;
  height: number;
}

/**
 * Layout architecture graph using hierarchical containment
 */
export function layoutArchitectureGraph(
  nodes: ParsedNode[],
  _connections: LayoutConnection[]
): LayoutNode[] {
  if (nodes.length === 0) {
    return [];
  }

  const config = DESIGN_STUDIO_CONFIG.architectureLayout;
  const shapeConfig = DESIGN_STUDIO_CONFIG.shapes.architecture;

  // Build parent-to-children map preserving input order
  const childrenMap = new Map<string | null, ParsedNode[]>();
  childrenMap.set(null, []); // Root level children

  nodes.forEach((node) => {
    const parentKey = node.parent ?? null;
    if (!childrenMap.has(parentKey)) {
      childrenMap.set(parentKey, []);
    }
    childrenMap.get(parentKey)!.push(node);
  });

  // Get top-level groups and orphan services
  const rootChildren = childrenMap.get(null) || [];
  const topLevelGroups = rootChildren.filter((n) => n.nodeType === 'group');
  const orphanServices = rootChildren.filter((n) => n.nodeType !== 'group');

  // Create a map of node IDs to nodes for quick lookup
  const nodeMap = new Map<string, ParsedNode>();
  nodes.forEach((node) => nodeMap.set(node.id, node));

  // Layout all positioned nodes
  const allLayoutedNodes: LayoutNode[] = [];

  // Layout top-level groups horizontally
  let currentX: number = config.startPosition.x;
  const startY: number = config.startPosition.y;
  let maxGroupBottom: number = startY;

  for (const group of topLevelGroups) {
    const result = layoutGroupRecursive(
      group,
      childrenMap,
      nodeMap,
      currentX,
      startY,
      shapeConfig,
      config
    );
    allLayoutedNodes.push(...result.nodes);
    currentX += result.width + config.groupSpacing;
    maxGroupBottom = Math.max(maxGroupBottom, startY + result.height);
  }

  // Layout orphan services below the groups
  if (orphanServices.length > 0) {
    const orphanY = topLevelGroups.length > 0
      ? maxGroupBottom + config.orphanSpacing
      : startY;

    const orphanResult = layoutChildrenInGrid(
      orphanServices.map((n) => addDimensions(n, shapeConfig)),
      config.startPosition.x,
      orphanY,
      config.maxGridColumns,
      config.gridSpacing
    );
    allLayoutedNodes.push(...orphanResult.nodes);
  }

  return allLayoutedNodes;
}

/**
 * Recursively layout a group and all its children
 */
function layoutGroupRecursive(
  group: ParsedNode,
  childrenMap: Map<string | null, ParsedNode[]>,
  nodeMap: Map<string, ParsedNode>,
  x: number,
  y: number,
  shapeConfig: typeof DESIGN_STUDIO_CONFIG.shapes.architecture,
  layoutConfig: typeof DESIGN_STUDIO_CONFIG.architectureLayout
): LayoutResult {
  const children = childrenMap.get(group.id) || [];
  const padding = layoutConfig.groupPadding;

  // If no children, return minimum size group
  if (children.length === 0) {
    const groupNode: LayoutNode = {
      ...group,
      x,
      y,
      width: shapeConfig.group.minWidth,
      height: shapeConfig.group.minHeight,
    };
    return {
      nodes: [groupNode],
      width: shapeConfig.group.minWidth,
      height: shapeConfig.group.minHeight,
    };
  }

  // First pass: recursively size all child groups
  const sizedChildren: SizedNode[] = children.map((child) => {
    if (child.nodeType === 'group') {
      // Recursively calculate size of nested groups
      const nestedResult = layoutGroupRecursive(
        child,
        childrenMap,
        nodeMap,
        0, // Position will be set later
        0,
        shapeConfig,
        layoutConfig
      );
      return {
        ...child,
        width: nestedResult.width,
        height: nestedResult.height,
      };
    } else {
      // Services use fixed dimensions
      return addDimensions(child, shapeConfig);
    }
  });

  // Layout children in grid within the group content area
  const contentX = x + padding.left;
  const contentY = y + padding.top;
  const gridResult = layoutChildrenInGrid(
    sizedChildren,
    contentX,
    contentY,
    layoutConfig.maxGridColumns,
    layoutConfig.gridSpacing
  );

  // Calculate group size to fit content
  const groupWidth = Math.max(
    gridResult.width + padding.left + padding.right,
    shapeConfig.group.minWidth
  );
  const groupHeight = Math.max(
    gridResult.height + padding.top + padding.bottom,
    shapeConfig.group.minHeight
  );

  // Create the group node
  const groupNode: LayoutNode = {
    ...group,
    x,
    y,
    width: groupWidth,
    height: groupHeight,
  };

  // Now recursively layout nested groups with correct positions
  const allNodes: LayoutNode[] = [groupNode];

  for (const layoutedChild of gridResult.nodes) {
    if (layoutedChild.nodeType === 'group') {
      // Re-layout nested group at correct position to get all its children
      const nestedResult = layoutGroupRecursive(
        nodeMap.get(layoutedChild.id)!,
        childrenMap,
        nodeMap,
        layoutedChild.x,
        layoutedChild.y,
        shapeConfig,
        layoutConfig
      );
      allNodes.push(...nestedResult.nodes);
    } else {
      allNodes.push(layoutedChild);
    }
  }

  return {
    nodes: allNodes,
    width: groupWidth,
    height: groupHeight,
  };
}

/**
 * Layout children in a grid pattern
 */
function layoutChildrenInGrid(
  children: SizedNode[],
  startX: number,
  startY: number,
  maxColumns: number,
  spacing: { horizontal: number; vertical: number }
): LayoutResult {
  if (children.length === 0) {
    return { nodes: [], width: 0, height: 0 };
  }

  // Calculate dynamic column count
  const columns = Math.min(children.length, maxColumns);
  const rows = Math.ceil(children.length / columns);

  // Calculate max dimensions per column/row for alignment
  const columnWidths: number[] = new Array(columns).fill(0);
  const rowHeights: number[] = new Array(rows).fill(0);

  children.forEach((child, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    columnWidths[col] = Math.max(columnWidths[col], child.width);
    rowHeights[row] = Math.max(rowHeights[row], child.height);
  });

  // Calculate column X positions (left edge of each column)
  const columnX: number[] = [0];
  for (let i = 1; i < columns; i++) {
    columnX[i] = columnX[i - 1] + columnWidths[i - 1] + spacing.horizontal;
  }

  // Calculate row Y positions (top edge of each row)
  const rowY: number[] = [0];
  for (let i = 1; i < rows; i++) {
    rowY[i] = rowY[i - 1] + rowHeights[i - 1] + spacing.vertical;
  }

  // Position each child
  const layoutedNodes: LayoutNode[] = children.map((child, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);

    // Center child within its cell
    const cellWidth = columnWidths[col];
    const cellHeight = rowHeights[row];
    const offsetX = (cellWidth - child.width) / 2;
    const offsetY = (cellHeight - child.height) / 2;

    return {
      ...child,
      x: startX + columnX[col] + offsetX,
      y: startY + rowY[row] + offsetY,
    };
  });

  // Calculate total grid dimensions
  const totalWidth = columnX[columns - 1] + columnWidths[columns - 1];
  const totalHeight = rowY[rows - 1] + rowHeights[rows - 1];

  return {
    nodes: layoutedNodes,
    width: totalWidth,
    height: totalHeight,
  };
}

/**
 * Add dimensions to a node based on its type
 */
function addDimensions(
  node: ParsedNode,
  shapeConfig: typeof DESIGN_STUDIO_CONFIG.shapes.architecture
): SizedNode {
  let width: number;
  let height: number;

  switch (node.nodeType) {
    case 'service':
      width = shapeConfig.service.width;
      height = shapeConfig.service.height;
      break;
    case 'group':
      width = shapeConfig.group.minWidth;
      height = shapeConfig.group.minHeight;
      break;
    default:
      width = shapeConfig.service.width;
      height = shapeConfig.service.height;
  }

  return { ...node, width, height };
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
  const maxX = Math.max(...nodes.map((n) => n.x + n.width));
  const minY = Math.min(...nodes.map((n) => n.y));
  const maxY = Math.max(...nodes.map((n) => n.y + n.height));

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

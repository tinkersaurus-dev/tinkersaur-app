/**
 * Tree Component
 * Custom tree component with full control over styling and behavior
 */

import { useState, useMemo, useLayoutEffect } from 'react';
import { TreeNode, type TreeNodeData, type DropPosition } from './TreeNode';

export type { DropPosition };

interface TreeProps {
  data: TreeNodeData[];
  defaultExpandAll?: boolean;
  defaultExpandedKeys?: Set<string>; // Specific keys to expand by default (takes precedence over defaultExpandAll)
  indentSize?: number; // pixels per depth level
  onDoubleClick?: (key: string) => void;
  onContextMenu?: (event: React.MouseEvent, key: string) => void;
  onDragOver?: (event: React.DragEvent, key: string) => void;
  onDrop?: (event: React.DragEvent, key: string) => void;
  editingNodeKey?: string | null;
  editingValue?: string;
  onEditingChange?: (newValue: string) => void;
  onEditingFinish?: () => void;
  // Reorder support
  allowReorder?: boolean;
  onReorder?: (draggedKey: string, targetKey: string, position: DropPosition) => void;
}

export function Tree({
  data,
  defaultExpandAll = false,
  defaultExpandedKeys,
  indentSize = 4,
  onDoubleClick,
  onContextMenu,
  onDragOver,
  onDrop,
  editingNodeKey,
  editingValue,
  onEditingChange,
  onEditingFinish,
  allowReorder = false,
  onReorder,
}: TreeProps) {
  // Track which node is being dragged (for reorder)
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  // Calculate all keys that can be expanded
  const allExpandableKeys = useMemo(() => {
    const keys = new Set<string>();
    const collectKeys = (nodes: TreeNodeData[]) => {
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          keys.add(node.key);
          collectKeys(node.children);
        }
      });
    };
    collectKeys(data);
    return keys;
  }, [data]);

  // Initialize state based on defaultExpandedKeys or defaultExpandAll
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => {
    if (defaultExpandedKeys) return defaultExpandedKeys;
    if (defaultExpandAll) return allExpandableKeys;
    return new Set();
  });

  // Sync expanded keys when dependencies change
  // Use useLayoutEffect to avoid visual flashing
  useLayoutEffect(() => {
    if (defaultExpandedKeys) {
      // When using specific keys, add any new keys that should be expanded
      setExpandedKeys((prev) => {
        const next = new Set(prev);
        defaultExpandedKeys.forEach((key) => next.add(key));
        return next;
      });
    } else if (defaultExpandAll) {
      setExpandedKeys(allExpandableKeys);
    }
  }, [allExpandableKeys, defaultExpandAll, defaultExpandedKeys]);

  const handleToggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleReorderDragStart = (key: string) => {
    setDraggedKey(key);
  };

  const handleReorderDragEnd = () => {
    setDraggedKey(null);
  };

  const handleReorderDrop = (targetKey: string, position: DropPosition) => {
    if (draggedKey && onReorder && draggedKey !== targetKey) {
      onReorder(draggedKey, targetKey, position);
    }
    setDraggedKey(null);
  };

  return (
    <div className='bg-[var(--bg-dark)]' style={{ fontSize: 'var(--font-size-xs)' }}>
      {data.map((node) => (
        <TreeNode
          key={node.key}
          node={node}
          depth={0}
          indentSize={indentSize}
          expandedKeys={expandedKeys}
          onToggleExpand={handleToggleExpand}
          onDoubleClick={onDoubleClick}
          onContextMenu={onContextMenu}
          onDragOver={onDragOver}
          onDrop={onDrop}
          editingNodeKey={editingNodeKey}
          editingValue={editingValue}
          onEditingChange={onEditingChange}
          onEditingFinish={onEditingFinish}
          allowReorder={allowReorder}
          draggedKey={draggedKey}
          onReorderDragStart={handleReorderDragStart}
          onReorderDragEnd={handleReorderDragEnd}
          onReorderDrop={handleReorderDrop}
        />
      ))}
    </div>
  );
}

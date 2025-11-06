/**
 * Tree Component
 * Custom tree component with full control over styling and behavior
 */

import { useState, useMemo, useLayoutEffect } from 'react';
import { TreeNode, type TreeNodeData } from './TreeNode';

interface TreeProps {
  data: TreeNodeData[];
  defaultExpandAll?: boolean;
  indentSize?: number; // pixels per depth level
  onDoubleClick?: (key: string) => void;
}

export function Tree({
  data,
  defaultExpandAll = false,
  indentSize = 4,
  onDoubleClick,
}: TreeProps) {
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

  // Initialize state based on defaultExpandAll
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() =>
    defaultExpandAll ? allExpandableKeys : new Set()
  );

  // Sync expanded keys when allExpandableKeys or defaultExpandAll changes
  // Use useLayoutEffect to avoid visual flashing
  useLayoutEffect(() => {
    if (defaultExpandAll) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedKeys(allExpandableKeys);
    }
  }, [allExpandableKeys, defaultExpandAll]);

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

  return (
    <div className='bg-[var(--bg-dark)]' style={{ fontSize: '10px' }}>
      {data.map((node) => (
        <TreeNode
          key={node.key}
          node={node}
          depth={0}
          indentSize={indentSize}
          expandedKeys={expandedKeys}
          onToggleExpand={handleToggleExpand}
          onDoubleClick={onDoubleClick}
        />
      ))}
    </div>
  );
}

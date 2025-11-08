/**
 * TreeNode Component
 * Recursive tree node with expand/collapse and custom indentation
 */

import type { ReactNode } from 'react';
import { FiChevronRight, FiChevronDown } from 'react-icons/fi';

export interface TreeNodeData {
  title: string;
  key: string;
  icon?: ReactNode;
  children?: TreeNodeData[];
  isLeaf?: boolean;
}

interface TreeNodeProps {
  node: TreeNodeData;
  depth: number;
  indentSize: number;
  expandedKeys: Set<string>;
  onToggleExpand: (key: string) => void;
  onDoubleClick?: (key: string) => void;
  onContextMenu?: (event: React.MouseEvent, key: string) => void;
}

export function TreeNode({
  node,
  depth,
  indentSize,
  expandedKeys,
  onToggleExpand,
  onDoubleClick,
  onContextMenu,
}: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedKeys.has(node.key);

  const handleClick = () => {
    if (hasChildren) {
      onToggleExpand(node.key);
    }
  };

  const handleDoubleClick = () => {
    if (onDoubleClick) {
      onDoubleClick(node.key);
    }
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    if (onContextMenu) {
      event.preventDefault();
      onContextMenu(event, node.key);
    }
  };

  return (
    <div>
      {/* Node row */}
      <div
        className='hover:bg-[var(--highlight)]'
        style={{
          paddingLeft: `${depth * indentSize}px`,
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          overflow: 'hidden',
          minWidth: 0,
        }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Expand/collapse icon */}
        <span
          className='text-xs text-[var(--text-muted)]'
          style={{
            width: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '2px',
            flexShrink: 0,
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <FiChevronDown />
            ) : (
              <FiChevronRight />
            )
          ) : null}
        </span>

        {/* Node icon */}
        {node.icon && (
          <span
            className='text-xs text-[var(--text-muted)]'
            style={{
              marginRight: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            {node.icon}
          </span>
        )}

        {/* Node title */}
        <span
          className='text-xs text-[var(--text-muted)]'
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0,
          }}
        >
          {node.title}
        </span>
      </div>

      {/* Children (recursive) */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.key}
              node={child}
              depth={depth + 1}
              indentSize={indentSize}
              expandedKeys={expandedKeys}
              onToggleExpand={onToggleExpand}
              onDoubleClick={onDoubleClick}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}

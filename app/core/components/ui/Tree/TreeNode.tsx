/**
 * TreeNode Component
 * Recursive tree node with expand/collapse and custom indentation
 */

import { useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { FiChevronRight, FiChevronDown } from 'react-icons/fi';

export interface TreeNodeData {
  title: string;
  key: string;
  icon?: ReactNode;
  children?: TreeNodeData[];
  isLeaf?: boolean;
  draggable?: boolean;
  dragData?: Record<string, unknown>;
}

interface TreeNodeProps {
  node: TreeNodeData;
  depth: number;
  indentSize: number;
  expandedKeys: Set<string>;
  onToggleExpand: (key: string) => void;
  onDoubleClick?: (key: string) => void;
  onContextMenu?: (event: React.MouseEvent, key: string) => void;
  onDragOver?: (event: React.DragEvent, key: string) => void;
  onDrop?: (event: React.DragEvent, key: string) => void;
  editingNodeKey?: string | null;
  editingValue?: string;
  onEditingChange?: (newValue: string) => void;
  onEditingFinish?: () => void;
}

export function TreeNode({
  node,
  depth,
  indentSize,
  expandedKeys,
  onToggleExpand,
  onDoubleClick,
  onContextMenu,
  onDragOver,
  onDrop,
  editingNodeKey,
  editingValue,
  onEditingChange,
  onEditingFinish,
}: TreeNodeProps) {
  const isEditing = editingNodeKey === node.key;
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedKeys.has(node.key);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus and select text when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    // Row click no longer expands/collapses - only chevron does that
    // This can be used for selection or other node interactions in the future
  };

  const handleChevronClick = (event: React.MouseEvent) => {
    event.stopPropagation();
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

  const handleDragStart = (event: React.DragEvent) => {
    if (node.draggable && node.dragData) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('application/json', JSON.stringify(node.dragData));

      // Create custom drag image showing just the title
      const dragImage = document.createElement('div');
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      dragImage.style.padding = '4px 8px';
      dragImage.style.backgroundColor = 'var(--bg-light)';
      dragImage.style.border = '1px solid var(--border)';
      dragImage.style.borderRadius = '4px';
      dragImage.style.fontSize = '10px';
      dragImage.style.color = 'var(--text)';
      dragImage.textContent = node.title;
      document.body.appendChild(dragImage);
      event.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    if (onDragOver) {
      onDragOver(event, node.key);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (onDrop) {
      onDrop(event, node.key);
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
          cursor: node.draggable ? 'grab' : 'pointer',
          transition: 'background-color 0.2s',
          overflow: 'hidden',
          minWidth: 0,
        }}
        draggable={node.draggable}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Expand/collapse icon */}
        <span
          className='text-xs text-[var(--text-muted)] hover:text-[var(--text)]'
          style={{
            width: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '2px',
            flexShrink: 0,
            cursor: hasChildren ? 'pointer' : 'default',
          }}
          onClick={handleChevronClick}
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

        {/* Node title or editable input */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editingValue ?? node.title}
            onChange={(e) => onEditingChange?.(e.target.value)}
            onBlur={onEditingFinish}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') {
                e.preventDefault();
                onEditingFinish?.();
              }
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            className='text-xs text-[var(--text)] bg-[var(--bg-light)] border border-[var(--border)] rounded px-1 focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)]'
            style={{
              flex: 1,
              minWidth: 0,
              outline: 'none',
            }}
          />
        ) : (
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
        )}
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
              onDragOver={onDragOver}
              onDrop={onDrop}
              editingNodeKey={editingNodeKey}
              editingValue={editingValue}
              onEditingChange={onEditingChange}
              onEditingFinish={onEditingFinish}
            />
          ))}
        </div>
      )}
    </div>
  );
}

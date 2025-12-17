/**
 * TreeNode Component
 * Recursive tree node with expand/collapse, custom indentation, and drag-drop reorder support
 */

import { useRef, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { FiChevronRight, FiChevronDown } from 'react-icons/fi';

export type DropPosition = 'before' | 'after' | 'inside';

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
  // Reorder support
  allowReorder?: boolean;
  draggedKey?: string | null;
  onReorderDragStart?: (key: string) => void;
  onReorderDragEnd?: () => void;
  onReorderDrop?: (targetKey: string, position: DropPosition) => void;
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
  allowReorder = false,
  draggedKey,
  onReorderDragStart,
  onReorderDragEnd,
  onReorderDrop,
}: TreeNodeProps) {
  const isEditing = editingNodeKey === node.key;
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedKeys.has(node.key);
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  // Drop position state for visual indicator
  const [dropPosition, setDropPosition] = useState<DropPosition | null>(null);

  // Is this node a folder (has key starting with folder-)?
  const isFolder = node.key.startsWith('folder-');

  // Is this node being dragged?
  const isDragging = draggedKey === node.key;

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
    // Handle reorder drag
    if (allowReorder && onReorderDragStart) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', node.key);
      onReorderDragStart(node.key);

      // Create custom drag image
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
      return;
    }

    // Handle legacy draggable behavior (for reference drops etc.)
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

  const handleDragEnd = () => {
    if (allowReorder && onReorderDragEnd) {
      onReorderDragEnd();
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    // Handle reorder drag over
    if (allowReorder && draggedKey && draggedKey !== node.key) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';

      // Calculate drop position based on mouse position
      const rect = nodeRef.current?.getBoundingClientRect();
      if (rect) {
        const y = event.clientY - rect.top;
        const height = rect.height;

        if (isFolder) {
          // For folders: top 25% = before, middle 50% = inside, bottom 25% = after
          if (y < height * 0.25) {
            setDropPosition('before');
          } else if (y > height * 0.75) {
            setDropPosition('after');
          } else {
            setDropPosition('inside');
          }
        } else {
          // For non-folders: top 50% = before, bottom 50% = after
          if (y < height * 0.5) {
            setDropPosition('before');
          } else {
            setDropPosition('after');
          }
        }
      }
      return;
    }

    // Handle legacy drag over
    if (onDragOver) {
      onDragOver(event, node.key);
    }
  };

  const handleDragLeave = () => {
    setDropPosition(null);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Handle reorder drop
    if (allowReorder && dropPosition && onReorderDrop && draggedKey !== node.key) {
      onReorderDrop(node.key, dropPosition);
      setDropPosition(null);
      return;
    }

    // Handle legacy drop
    if (onDrop) {
      onDrop(event, node.key);
    }
    setDropPosition(null);
  };

  // Determine if this node should be draggable for reorder
  const canDrag = allowReorder || node.draggable;

  return (
    <div style={{ position: 'relative' }}>
      {/* Drop indicator - before */}
      {dropPosition === 'before' && (
        <div
          style={{
            position: 'absolute',
            left: `${depth * indentSize + 16}px`,
            right: 0,
            top: 0,
            height: '2px',
            backgroundColor: 'var(--primary)',
            zIndex: 10,
          }}
        />
      )}

      {/* Node row */}
      <div
        ref={nodeRef}
        className='hover:bg-[var(--highlight)]'
        style={{
          paddingLeft: `${depth * indentSize}px`,
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          cursor: canDrag ? 'grab' : 'pointer',
          transition: 'background-color 0.2s',
          overflow: 'hidden',
          minWidth: 0,
          opacity: isDragging ? 0.5 : 1,
          backgroundColor: dropPosition === 'inside' ? 'var(--highlight)' : undefined,
        }}
        draggable={canDrag}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
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

      {/* Drop indicator - after */}
      {dropPosition === 'after' && (
        <div
          style={{
            position: 'absolute',
            left: `${depth * indentSize + 16}px`,
            right: 0,
            bottom: 0,
            height: '2px',
            backgroundColor: 'var(--primary)',
            zIndex: 10,
          }}
        />
      )}

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
              allowReorder={allowReorder}
              draggedKey={draggedKey}
              onReorderDragStart={onReorderDragStart}
              onReorderDragEnd={onReorderDragEnd}
              onReorderDrop={onReorderDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}

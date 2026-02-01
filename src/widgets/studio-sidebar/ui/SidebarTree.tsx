/**
 * SidebarTree Component
 * Thin wrapper around the Tree component with sidebar-specific props.
 */

import { Tree } from '@/shared/ui';
import type { SidebarTreeProps } from '../model/types';

export function SidebarTree({
  treeData,
  defaultExpandedKeys,
  editingNodeKey,
  editingValue,
  onEditingChange,
  onEditingFinish,
  onDoubleClick,
  onContextMenu,
  onDragOver,
  onDrop,
  onReorder,
}: SidebarTreeProps) {
  return (
    <Tree
      data={treeData}
      defaultExpandedKeys={defaultExpandedKeys}
      indentSize={8}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onDragOver={onDragOver}
      onDrop={onDrop}
      editingNodeKey={editingNodeKey}
      editingValue={editingValue}
      onEditingChange={onEditingChange}
      onEditingFinish={onEditingFinish}
      allowReorder={true}
      onReorder={onReorder}
    />
  );
}

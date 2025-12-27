/**
 * useSidebarDragDrop Hook
 * Handles drag-drop reordering logic for the sidebar tree.
 */

import { useCallback } from 'react';
import type { DropPosition } from '~/core/components';
import type { DesignWork } from '~/core/entities/design-studio';
import type { UseSidebarDragDropProps, UseSidebarDragDropReturn } from '../types';

export function useSidebarDragDrop({
  designWorks,
  reorderItems,
  getAllItemsAtLevel,
  folderDropHandlers,
}: UseSidebarDragDropProps): UseSidebarDragDropReturn {
  const { canDropOnFolder, handleFolderDrop } = folderDropHandlers;

  // Handle drag-and-drop reordering
  const handleReorder = useCallback(
    async (draggedKey: string, targetKey: string, position: DropPosition) => {
      // Parse dragged item key
      const [draggedType, ...draggedIdParts] = draggedKey.split('-');
      const draggedId = draggedIdParts.join('-');

      // Parse target item key
      const [targetType, ...targetIdParts] = targetKey.split('-');
      const targetId = targetIdParts.join('-');

      // Determine item types
      const draggedItemType = draggedType as 'folder' | 'diagram' | 'interface' | 'document';
      const targetItemType = targetType as 'folder' | 'diagram' | 'interface' | 'document';

      // Find the parent folder of the target item and its order
      let newParentId: string | undefined;
      let targetItemOrder: number;

      if (targetItemType === 'folder') {
        const targetFolder = designWorks.find((dw) => dw.id === targetId);
        if (!targetFolder) return;
        targetItemOrder = targetFolder.order;

        if (position === 'inside') {
          // Dropping inside a folder - become a child at the end
          newParentId = targetId;
          const allChildren = getAllItemsAtLevel(targetId);
          const maxOrder = allChildren.length > 0 ? Math.max(...allChildren.map((c) => c.order)) : -1;
          await reorderItems([
            {
              id: draggedId,
              itemType: draggedItemType,
              newOrder: maxOrder + 1,
              newParentDesignWorkId: newParentId,
            },
          ]);
          return;
        } else {
          // Dropping before/after a folder - same parent level
          newParentId = targetFolder.parentDesignWorkId;
        }
      } else {
        // Target is a content item (diagram, interface, document)
        // Find which folder contains this content item
        let containingFolder: DesignWork | undefined;
        for (const dw of designWorks) {
          const hasItem =
            dw.diagrams?.some((d) => d.id === targetId) ||
            dw.interfaces?.some((i) => i.id === targetId) ||
            dw.documents?.some((d) => d.id === targetId);
          if (hasItem) {
            containingFolder = dw;
            break;
          }
        }
        if (!containingFolder) return;

        newParentId = containingFolder.id;

        // Get target item's order
        if (targetType === 'diagram') {
          targetItemOrder = containingFolder.diagrams?.find((d) => d.id === targetId)?.order ?? 0;
        } else if (targetType === 'interface') {
          targetItemOrder = containingFolder.interfaces?.find((i) => i.id === targetId)?.order ?? 0;
        } else {
          targetItemOrder = containingFolder.documents?.find((d) => d.id === targetId)?.order ?? 0;
        }
      }

      // Calculate the new order based on position relative to target
      // 'before' = take target's order (target and everything after shifts up)
      // 'after' = take target's order + 1 (everything after target shifts up)
      const newOrder = position === 'before' ? targetItemOrder : targetItemOrder + 1;

      await reorderItems([
        {
          id: draggedId,
          itemType: draggedItemType,
          newOrder,
          newParentDesignWorkId: newParentId,
        },
      ]);
    },
    [designWorks, reorderItems, getAllItemsAtLevel]
  );

  // Handle drag over for reference drops onto folders
  const handleTreeDragOver = useCallback(
    (event: React.DragEvent, nodeKey: string) => {
      // Only allow drop on folder nodes
      if (!nodeKey.startsWith('folder-')) return;

      try {
        // Check if this is a folder-droppable reference
        const jsonData = event.dataTransfer.getData('application/json');
        if (!jsonData) {
          // During dragover, getData returns empty string in some browsers
          // Check types instead
          if (event.dataTransfer.types.includes('application/json')) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
          }
          return;
        }

        const dragData = JSON.parse(jsonData);
        if (canDropOnFolder(dragData)) {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
        }
      } catch {
        // Ignore parse errors during drag - types check above handles this
        if (event.dataTransfer.types.includes('application/json')) {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
        }
      }
    },
    [canDropOnFolder]
  );

  // Handle drop on tree nodes (for folder reference drops)
  const handleTreeDrop = useCallback(
    async (event: React.DragEvent, nodeKey: string) => {
      event.preventDefault();

      // Only handle drops on folder nodes
      if (!nodeKey.startsWith('folder-')) return;

      try {
        const jsonData = event.dataTransfer.getData('application/json');
        if (!jsonData) return;

        const dragData = JSON.parse(jsonData);

        // Verify this is a folder-droppable reference
        if (!canDropOnFolder(dragData)) return;

        // Extract folder ID from node key
        const folderId = nodeKey.replace('folder-', '');

        // Handle the drop
        await handleFolderDrop(folderId, dragData);
      } catch (error) {
        console.error('Failed to handle tree drop:', error);
      }
    },
    [canDropOnFolder, handleFolderDrop]
  );

  return {
    handleReorder,
    handleTreeDragOver,
    handleTreeDrop,
  };
}

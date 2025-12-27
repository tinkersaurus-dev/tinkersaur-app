/**
 * useSidebarContextMenu Hook
 * Handles context menu state and menu item generation for the sidebar.
 */

import { useState, useCallback } from 'react';
import type { DropdownMenuItem } from '~/core/components';
import type {
  ContextMenuState,
  UseSidebarContextMenuProps,
  UseSidebarContextMenuReturn,
} from '../types';

export function useSidebarContextMenu({
  designWorks,
  crudOperations,
  onOpenDiagramModal,
  onOpenLinkUseCaseModal,
  onStartRename,
  onAddSubfolder,
}: UseSidebarContextMenuProps): UseSidebarContextMenuReturn {
  const {
    createDocument,
    createInterface,
    deleteDiagram,
    deleteInterface,
    deleteDocument,
    deleteDesignWork,
  } = crudOperations;

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Handle right-click on tree node
  const handleContextMenu = useCallback((event: React.MouseEvent, nodeKey: string) => {
    event.preventDefault();
    setContextMenu({
      isOpen: true,
      x: event.clientX,
      y: event.clientY,
      nodeKey,
    });
  }, []);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Get context menu items based on node type
  const getContextMenuItems = useCallback((): DropdownMenuItem[] => {
    if (!contextMenu) return [];

    const [type, ...idParts] = contextMenu.nodeKey.split('-');
    const id = idParts.join('-');

    if (type === 'folder') {
      // Folder context menu
      const designWork = designWorks.find((dw) => dw.id === id);
      return [
        {
          key: 'add-diagram',
          label: 'Add Diagram',
          onClick: () => {
            onOpenDiagramModal(id);
            closeContextMenu();
          },
        },
        {
          key: 'add-document',
          label: 'Add Document',
          onClick: async () => {
            await createDocument({
              designWorkId: id,
              name: 'New Document',
              content: '',
            });
            closeContextMenu();
          },
        },
        {
          key: 'add-interface',
          label: 'Add Interface',
          onClick: async () => {
            await createInterface({
              designWorkId: id,
              name: 'New Interface',
              fidelity: 'low',
            });
            closeContextMenu();
          },
        },
        {
          key: 'link-use-case',
          label: 'Link to Use Case',
          onClick: () => {
            onOpenLinkUseCaseModal(id);
            closeContextMenu();
          },
        },
        {
          key: 'create-subfolder',
          label: 'Create Subfolder',
          onClick: async () => {
            await onAddSubfolder(id);
            closeContextMenu();
          },
        },
        {
          key: 'divider-1',
          label: '',
          type: 'divider',
        },
        {
          key: 'rename',
          label: 'Rename',
          onClick: () => {
            if (designWork) {
              onStartRename(id, designWork.name);
            }
            closeContextMenu();
          },
        },
        {
          key: 'delete',
          label: 'Delete',
          onClick: async () => {
            if (confirm('Are you sure you want to delete this folder and all its contents?')) {
              await deleteDesignWork(id);
            }
            closeContextMenu();
          },
        },
      ];
    } else {
      // Content item context menu (diagram, interface, document)
      let deleteHandler: () => Promise<void>;
      switch (type) {
        case 'diagram':
          deleteHandler = async () => await deleteDiagram(id);
          break;
        case 'interface':
          deleteHandler = async () => await deleteInterface(id);
          break;
        case 'document':
          deleteHandler = async () => await deleteDocument(id);
          break;
        default:
          return [];
      }

      return [
        {
          key: 'delete',
          label: 'Delete',
          onClick: async () => {
            if (confirm(`Are you sure you want to delete this ${type}?`)) {
              await deleteHandler();
            }
            closeContextMenu();
          },
        },
      ];
    }
  }, [
    contextMenu,
    designWorks,
    createDocument,
    createInterface,
    deleteDiagram,
    deleteInterface,
    deleteDocument,
    deleteDesignWork,
    onStartRename,
    onAddSubfolder,
    onOpenDiagramModal,
    onOpenLinkUseCaseModal,
    closeContextMenu,
  ]);

  return {
    contextMenu,
    handleContextMenu,
    closeContextMenu,
    getContextMenuItems,
  };
}

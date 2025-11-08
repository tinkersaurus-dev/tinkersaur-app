/**
 * StudioSidebar Component
 * Displays tree view of design content organized in folders (DesignWorks)
 * DesignWorks represent folders in the tree hierarchy
 */

import { useMemo, useState, useCallback } from 'react';
import { MdFolder, MdDescription, MdAccountTree, MdDashboard } from 'react-icons/md';
import { FiFolderPlus } from 'react-icons/fi';
import { Tree, Dropdown } from '~/core/components';
import type { TreeNodeData, DropdownMenuItem } from '~/core/components';
import { Button } from '~/core/components/ui/Button';
import { useDesignStudioUIStore } from '../store';
import { useDesignStudioEntityStore, type DesignContentType } from '~/core/entities/design-studio';
import { useDesignStudioCRUD } from '../hooks/useDesignStudioCRUD';

interface StudioSidebarProps {
  solutionId: string;
}

export function StudioSidebar({ solutionId }: StudioSidebarProps) {
  // Use UI store for tab management only
  const { openTab } = useDesignStudioUIStore();

  // Get entity data from entity store - only need DesignWorks now
  const designWorks = useDesignStudioEntityStore((state) => state.designWorks);

  // CRUD operations
  const {
    createDiagram,
    createInterface,
    createDocument,
    deleteDiagram,
    deleteInterface,
    deleteDocument,
    deleteDesignWork,
    createDesignWork,
  } = useDesignStudioCRUD();

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    nodeKey: string;
  } | null>(null);

  // Handle creating a new folder at root level
  const handleAddFolder = useCallback(async () => {
    try {
      await createDesignWork({
        solutionId,
        name: 'New Folder',
        version: '1.0.0',
        diagrams: [],
        interfaces: [],
        documents: [],
      });
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  }, [createDesignWork, solutionId]);

  // Helper to get icon based on content type
  const getContentIcon = (type: DesignContentType) => {
    switch (type) {
      case 'diagram':
        return <MdAccountTree />;
      case 'interface':
        return <MdDashboard />;
      case 'document':
        return <MdDescription />;
    }
  };

  // Build tree recursively from DesignWorks (folders) using embedded metadata
  const buildTreeData = (parentDesignWorkId?: string): TreeNodeData[] => {
    const nodes: TreeNodeData[] = [];

    // Get child design works (folders) at this level
    const childDesignWorks = parentDesignWorkId
      ? designWorks.filter((dw) => dw.parentDesignWorkId === parentDesignWorkId)
      : designWorks.filter((dw) => dw.solutionId === solutionId && !dw.parentDesignWorkId);

    // Add each DesignWork as a folder
    childDesignWorks.forEach((designWork) => {
      // Build children (nested folders and content)
      const children: TreeNodeData[] = [];

      // Add nested folders recursively
      const nestedFolders = buildTreeData(designWork.id);
      children.push(...nestedFolders);

      // Combine all content items with their order
      const allContent: Array<{ order: number; node: TreeNodeData }> = [
        ...(designWork.diagrams || []).map((diagramRef) => ({
          order: diagramRef.order,
          node: {
            title: diagramRef.name,
            key: `diagram-${diagramRef.id}`,
            icon: getContentIcon('diagram'),
            isLeaf: true,
          },
        })),
        ...(designWork.interfaces || []).map((interfaceRef) => ({
          order: interfaceRef.order,
          node: {
            title: interfaceRef.name,
            key: `interface-${interfaceRef.id}`,
            icon: getContentIcon('interface'),
            isLeaf: true,
          },
        })),
        ...(designWork.documents || []).map((documentRef) => ({
          order: documentRef.order,
          node: {
            title: documentRef.name,
            key: `document-${documentRef.id}`,
            icon: getContentIcon('document'),
            isLeaf: true,
          },
        })),
      ];

      // Sort by order and add to children
      allContent.sort((a, b) => a.order - b.order);
      children.push(...allContent.map(item => item.node));

      nodes.push({
        title: designWork.name,
        key: `folder-${designWork.id}`,
        icon: <MdFolder />,
        children: children.length > 0 ? children : undefined,
      });
    });

    return nodes;
  };

  // Memoize tree data to avoid rebuilding on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const treeData = useMemo(() => buildTreeData(), [designWorks, solutionId]);

  const handleDoubleClick = (key: string) => {
    // Parse key to get type and id
    const [type, ...idParts] = key.split('-');
    const id = idParts.join('-'); // Rejoin in case ID contains hyphens

    if (type === 'folder') return; // Don't open folders

    let contentType: DesignContentType;
    let title = '';

    // Find the title from the DesignWork metadata
    switch (type) {
      case 'diagram': {
        contentType = 'diagram';
        // Search through all design works for the diagram ref
        for (const dw of designWorks) {
          const diagramRef = (dw.diagrams || []).find((ref) => ref.id === id);
          if (diagramRef) {
            title = diagramRef.name;
            break;
          }
        }
        title = title || 'Diagram';
        break;
      }
      case 'interface': {
        contentType = 'interface';
        // Search through all design works for the interface ref
        for (const dw of designWorks) {
          const interfaceRef = (dw.interfaces || []).find((ref) => ref.id === id);
          if (interfaceRef) {
            title = interfaceRef.name;
            break;
          }
        }
        title = title || 'Interface';
        break;
      }
      case 'document': {
        contentType = 'document';
        // Search through all design works for the document ref
        for (const dw of designWorks) {
          const documentRef = (dw.documents || []).find((ref) => ref.id === id);
          if (documentRef) {
            title = documentRef.name;
            break;
          }
        }
        title = title || 'Document';
        break;
      }
      default:
        return;
    }

    // Open tab
    openTab({
      type: contentType,
      contentId: id,
      title,
      closable: true,
    });
  };

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
      return [
        {
          key: 'add-diagram',
          label: 'Add Diagram',
          onClick: async () => {
            await createDiagram({
              designWorkId: id,
              name: 'New Diagram',
              type: 'bpmn',
            });
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
          key: 'divider-1',
          label: '',
          type: 'divider',
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
    createDiagram,
    createDocument,
    createInterface,
    deleteDiagram,
    deleteInterface,
    deleteDocument,
    deleteDesignWork,
    closeContextMenu,
  ]);

  return (
    <div className='bg-[var(--bg-dark)]' style={{ padding: '8px', height: '100%', overflow: 'auto' }}>
      <h3 className='text-[var(--text)]' style={{ marginBottom: '8px' }}>Product Name</h3>

      {/* Action bar */}
      <div style={{ marginBottom: '16px' }}>
        <Button
          variant="text"
          size="small"
          icon={<FiFolderPlus />}
          onClick={handleAddFolder}
        />
      </div>

      <Tree
        data={treeData}
        defaultExpandAll
        indentSize={8}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      />

      {contextMenu && (
        <Dropdown
          trigger="contextMenu"
          isOpen={contextMenu.isOpen}
          onClose={closeContextMenu}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          menu={{ items: getContextMenuItems() }}
        />
      )}
    </div>
  );
}

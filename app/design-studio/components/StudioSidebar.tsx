/**
 * StudioSidebar Component
 * Displays tree view of design content organized in folders (DesignWorks)
 * DesignWorks represent folders in the tree hierarchy
 */

import { useMemo, useState, useCallback, useEffect } from 'react';
import { MdFolder, MdDescription, MdAccountTree, MdDashboard, MdLink, MdLink as MdLinkIcon } from 'react-icons/md';
import { FiFolderPlus } from 'react-icons/fi';
import { Tree, Dropdown } from '~/core/components';
import type { TreeNodeData, DropdownMenuItem } from '~/core/components';
import { Button } from '~/core/components/ui/Button';
import { useDesignStudioUIStore } from '../store';
import { type DesignContentType, type DiagramType } from '~/core/entities/design-studio';
import { useDesignWorkStore } from '~/core/entities/design-studio/store/design-work/useDesignWorkStore';
import { useReferenceStore } from '~/core/entities/design-studio/store/reference/useReferenceStore';
import { useDesignStudioCRUD } from '../hooks/useDesignStudioCRUD';
import { CreateDiagramModal } from './CreateDiagramModal';
import { LinkUseCaseModal } from './LinkUseCaseModal';
import { useSolutionStore } from '~/core/entities/product-management/store/solution/useSolutionStore';

interface StudioSidebarProps {
  solutionId: string;
}

export function StudioSidebar({ solutionId }: StudioSidebarProps) {
  // Use UI store for tab management only
  const { openTab } = useDesignStudioUIStore();

  // Get solution name from solution store
  const solutionName = useSolutionStore((state) =>
    state.entities.find(s => s.id === solutionId)?.name
  );

  // Get entity data from entity store - only need DesignWorks now
  const designWorks = useDesignWorkStore((state) => state.designWorks);

  // Get all references for enriching tree nodes
  const references = useReferenceStore((state) => state.references);
  const fetchReferencesForContent = useReferenceStore((state) => state.fetchReferencesForContent);

  // Load references for all diagrams
  useEffect(() => {
    // Collect all diagram IDs from all design works
    const diagramIds = designWorks.flatMap((dw) => dw.diagrams.map((d) => d.id));
    console.warn('[References] Loading references for diagrams:', diagramIds);

    // Fetch references for each diagram
    diagramIds.forEach((diagramId) => {
      fetchReferencesForContent(diagramId);
    });
  }, [designWorks, fetchReferencesForContent]);

  // Log when references change
  useEffect(() => {
    console.warn('[References] References in store:', references);
  }, [references]);

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
    updateDesignWork,
  } = useDesignStudioCRUD();

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    nodeKey: string;
  } | null>(null);

  // Editing state for inline folder rename
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState<string>('');

  // Create diagram modal state
  const [createDiagramModalOpen, setCreateDiagramModalOpen] = useState(false);
  const [selectedDesignWorkId, setSelectedDesignWorkId] = useState<string>();

  // Link use case modal state
  const [linkUseCaseModalOpen, setLinkUseCaseModalOpen] = useState(false);
  const [linkUseCaseFolderId, setLinkUseCaseFolderId] = useState<string>();

  // Wrapper for createDiagram that matches the modal's expected signature
  const handleCreateDiagram = useCallback(
    async (data: { designWorkId: string; name: string; type: DiagramType }) => {
      await createDiagram(data);
    },
    [createDiagram]
  );

  // Handler for linking a folder to a use case
  const handleLinkUseCase = useCallback(
    async (designWorkId: string, useCaseId: string | undefined) => {
      await updateDesignWork(designWorkId, { useCaseId });
    },
    [updateDesignWork]
  );

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
        references: [],
      });
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  }, [createDesignWork, solutionId]);

  // Handle starting inline rename of a folder
  const handleStartRename = useCallback((folderId: string, currentName: string) => {
    setEditingFolderId(folderId);
    setEditingFolderName(currentName);
  }, []);

  // Handle finishing inline rename of a folder
  const handleFinishRename = useCallback(async () => {
    if (editingFolderId && editingFolderName.trim()) {
      try {
        await updateDesignWork(editingFolderId, { name: editingFolderName.trim() });
      } catch (error) {
        console.error('Failed to rename folder:', error);
      }
    }
    setEditingFolderId(null);
    setEditingFolderName('');
  }, [editingFolderId, editingFolderName, updateDesignWork]);

  // Handle changing folder name during inline edit
  const handleFolderNameChange = useCallback((newValue: string) => {
    setEditingFolderName(newValue);
  }, []);

  // Helper to get icon based on content type
  const getContentIcon = (type: DesignContentType | 'reference') => {
    switch (type) {
      case 'diagram':
        return <MdAccountTree />;
      case 'interface':
        return <MdDashboard />;
      case 'document':
        return <MdDescription />;
      case 'reference':
        return <MdLink />;
    }
  };

  // Memoize tree data to avoid rebuilding on every render
  const treeData = useMemo(() => {
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
          // Diagrams with their references as children
          ...(designWork.diagrams || []).map((diagramRef) => {
            // Get references for this diagram
            const diagramReferences = Object.values(references).filter(
              (ref) => ref.contentId === diagramRef.id
            );

            // Build reference nodes
            const referenceChildren: TreeNodeData[] = diagramReferences.map((fullReference) => ({
              title: fullReference.name,
              key: `reference-${fullReference.id}`,
              icon: getContentIcon('reference'),
              isLeaf: true,
              draggable: true,
              dragData: {
                type: 'reference',
                referenceId: fullReference.id,
                contentId: fullReference.contentId,
                contentType: fullReference.contentType,
                metadata: fullReference.metadata,
              },
            }));

            return {
              order: diagramRef.order,
              node: {
                title: diagramRef.name,
                key: `diagram-${diagramRef.id}`,
                icon: getContentIcon('diagram'),
                isLeaf: referenceChildren.length === 0,
                children: referenceChildren.length > 0 ? referenceChildren : undefined,
                draggable: true,
                dragData: {
                  type: 'diagram',
                  diagramId: diagramRef.id,
                  diagramName: diagramRef.name,
                },
              },
            };
          }),
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

        // Create folder icon, with link indicator if linked to a use case
        const folderIcon = designWork.useCaseId ? (
          <span className="flex items-center gap-0.5">
            <MdFolder />
            <MdLinkIcon className="text-[10px] text-[var(--text-secondary)]" />
          </span>
        ) : (
          <MdFolder />
        );

        nodes.push({
          title: designWork.name,
          key: `folder-${designWork.id}`,
          icon: folderIcon,
          children: children.length > 0 ? children : undefined,
        });
      });

      return nodes;
    };

    return buildTreeData();
  }, [designWorks, solutionId, references]);

  const handleDoubleClick = (key: string) => {
    // Parse key to get type and id
    const [type, ...idParts] = key.split('-');
    const id = idParts.join('-'); // Rejoin in case ID contains hyphens

    let title = '';

    // Handle folder double-click - open folder view
    if (type === 'folder') {
      const folder = designWorks.find((dw) => dw.id === id);
      title = folder?.name || 'Folder';
      openTab({
        type: 'folder-view',
        contentId: id,
        title,
        closable: true,
      });
      return;
    }

    let contentType: DesignContentType;

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
      const designWork = designWorks.find((dw) => dw.id === id);
      return [
        {
          key: 'add-diagram',
          label: 'Add Diagram',
          onClick: () => {
            setSelectedDesignWorkId(id);
            setCreateDiagramModalOpen(true);
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
            setLinkUseCaseFolderId(id);
            setLinkUseCaseModalOpen(true);
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
              handleStartRename(id, designWork.name);
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
    handleStartRename,
    closeContextMenu,
  ]);

  return (
    <div className='bg-[var(--bg-dark)]' style={{ padding: '8px', height: '100%', overflow: 'auto' }}>
      <h3 className='text-[var(--text)]' style={{ marginBottom: '8px' }}>{solutionName || 'Product Name'}</h3>

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
        editingNodeKey={editingFolderId ? `folder-${editingFolderId}` : null}
        editingValue={editingFolderName}
        onEditingChange={handleFolderNameChange}
        onEditingFinish={handleFinishRename}
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

      <CreateDiagramModal
        open={createDiagramModalOpen}
        designWorkId={selectedDesignWorkId}
        onClose={() => setCreateDiagramModalOpen(false)}
        onCreate={handleCreateDiagram}
      />

      <LinkUseCaseModal
        open={linkUseCaseModalOpen}
        designWorkId={linkUseCaseFolderId}
        currentUseCaseId={designWorks.find((dw) => dw.id === linkUseCaseFolderId)?.useCaseId}
        solutionId={solutionId}
        onClose={() => setLinkUseCaseModalOpen(false)}
        onLink={handleLinkUseCase}
      />
    </div>
  );
}

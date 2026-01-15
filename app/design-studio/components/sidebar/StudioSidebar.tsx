/**
 * StudioSidebar Component
 * Main container that orchestrates the sidebar tree view for design studio content.
 * DesignWorks represent folders in the tree hierarchy.
 */

import { useState, useCallback } from 'react';
import { FiFolderPlus } from 'react-icons/fi';
import { Button } from '~/core/components/ui/Button';
import type { DesignContentType } from '~/core/entities/design-studio';
import { useSidebarState } from './hooks/useSidebarState';
import { useSidebarTree } from './hooks/useSidebarTree';
import { useSidebarDragDrop } from './hooks/useSidebarDragDrop';
import { useSidebarContextMenu } from './hooks/useSidebarContextMenu';
import { SidebarTree } from './SidebarTree';
import { SidebarContextMenu } from './SidebarContextMenu';
import { SidebarModals } from './SidebarModals';
import type { StudioSidebarProps, SidebarModalState } from './types';

export function StudioSidebar({ solutionId, useCaseId }: StudioSidebarProps) {
  // 1. State hook - all store interactions
  const sidebarState = useSidebarState({ solutionId, useCaseId });

  // 2. Tree building hook
  const { treeData, defaultExpandedKeys, getAllItemsAtLevel } = useSidebarTree({
    designWorks: sidebarState.designWorks,
    references: sidebarState.references,
    solutionId,
  });

  // 3. Inline editing state (local)
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState<string>('');

  // 4. Modal state (local)
  const [modalState, setModalState] = useState<SidebarModalState>({
    createDiagramModalOpen: false,
    selectedDesignWorkId: undefined,
    linkUseCaseModalOpen: false,
    linkUseCaseFolderId: undefined,
  });

  // 5. Inline editing handlers
  const handleStartRename = useCallback((folderId: string, currentName: string) => {
    setEditingFolderId(folderId);
    setEditingFolderName(currentName);
  }, []);

  const handleFinishRename = useCallback(async () => {
    if (editingFolderId && editingFolderName.trim()) {
      try {
        await sidebarState.crudOperations.updateDesignWork(editingFolderId, {
          name: editingFolderName.trim(),
        });
      } catch (error) {
        console.error('Failed to rename folder:', error);
      }
    }
    setEditingFolderId(null);
    setEditingFolderName('');
  }, [editingFolderId, editingFolderName, sidebarState.crudOperations]);

  const handleFolderNameChange = useCallback((newValue: string) => {
    setEditingFolderName(newValue);
  }, []);

  // 6. Folder creation handlers
  const handleAddFolder = useCallback(async () => {
    try {
      await sidebarState.crudOperations.createDesignWork({
        solutionId,
        useCaseId, // Auto-link to use case if provided
        name: 'New Folder',
        version: '1.0.0',
        diagrams: [],
        interfaces: [],
        documents: [],
        references: [],
        requirementRefs: [],
      });
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  }, [sidebarState.crudOperations, solutionId, useCaseId]);

  const handleAddSubfolder = useCallback(
    async (parentFolderId: string) => {
      try {
        const newFolder = await sidebarState.crudOperations.createDesignWork({
          solutionId,
          useCaseId, // Auto-link to use case if provided
          parentDesignWorkId: parentFolderId,
          name: 'New Folder',
          version: '1.0.0',
          diagrams: [],
          interfaces: [],
          documents: [],
          references: [],
          requirementRefs: [],
        });

        // Immediately trigger inline rename for the new folder
        setEditingFolderId(newFolder.id);
        setEditingFolderName('New Folder');
      } catch (error) {
        console.error('Failed to create subfolder:', error);
      }
    },
    [sidebarState.crudOperations, solutionId, useCaseId]
  );

  // 7. Context menu hook
  const contextMenuManager = useSidebarContextMenu({
    designWorks: sidebarState.designWorks,
    crudOperations: sidebarState.crudOperations,
    onOpenDiagramModal: (folderId) => {
      setModalState((prev) => ({
        ...prev,
        selectedDesignWorkId: folderId,
        createDiagramModalOpen: true,
      }));
    },
    onOpenLinkUseCaseModal: (folderId) => {
      setModalState((prev) => ({
        ...prev,
        linkUseCaseFolderId: folderId,
        linkUseCaseModalOpen: true,
      }));
    },
    onStartRename: handleStartRename,
    onAddSubfolder: handleAddSubfolder,
  });

  // 8. Drag-drop hook
  const { handleReorder, handleTreeDragOver, handleTreeDrop } = useSidebarDragDrop({
    designWorks: sidebarState.designWorks,
    solutionId,
    reorderItems: sidebarState.crudOperations.reorderItems,
    getAllItemsAtLevel,
    folderDropHandlers: sidebarState.folderDropHandlers,
  });

  // 9. Double-click handler for opening tabs
  const handleDoubleClick = useCallback(
    (key: string) => {
      // Parse key to get type and id
      const [type, ...idParts] = key.split('-');
      const id = idParts.join('-');

      let title = '';

      // Handle folder double-click - open folder view
      if (type === 'folder') {
        const folder = sidebarState.designWorks.find((dw) => dw.id === id);
        title = folder?.name || 'Folder';
        sidebarState.openTab({
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
          for (const dw of sidebarState.designWorks) {
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
          for (const dw of sidebarState.designWorks) {
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
          for (const dw of sidebarState.designWorks) {
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

      sidebarState.openTab({
        type: contentType,
        contentId: id,
        title,
        closable: true,
      });
    },
    [sidebarState]
  );

  // 10. Modal handlers
  const handleCloseDiagramModal = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      createDiagramModalOpen: false,
    }));
  }, []);

  const handleCloseLinkUseCaseModal = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      linkUseCaseModalOpen: false,
    }));
  }, []);

  const handleLinkUseCase = useCallback(
    async (designWorkId: string, useCaseId: string | undefined) => {
      await sidebarState.crudOperations.updateDesignWork(designWorkId, { useCaseId });
    },
    [sidebarState.crudOperations]
  );

  const getCurrentUseCaseId = useCallback(
    (folderId: string | undefined) => {
      return sidebarState.designWorks.find((dw) => dw.id === folderId)?.useCaseId;
    },
    [sidebarState.designWorks]
  );

  return (
    <div className="bg-[var(--bg-dark)]" style={{ padding: '4px', height: '100%', overflow: 'auto' }}>
      {/* Action bar */}
      <div style={{ marginBottom: '16px' }}>
        <Button variant="text" size="small" icon={<FiFolderPlus />} onClick={handleAddFolder} />
      </div>

      <SidebarTree
        treeData={treeData}
        defaultExpandedKeys={defaultExpandedKeys}
        editingNodeKey={editingFolderId ? `folder-${editingFolderId}` : null}
        editingValue={editingFolderName}
        onEditingChange={handleFolderNameChange}
        onEditingFinish={handleFinishRename}
        onDoubleClick={handleDoubleClick}
        onContextMenu={contextMenuManager.handleContextMenu}
        onDragOver={handleTreeDragOver}
        onDrop={handleTreeDrop}
        onReorder={handleReorder}
      />

      <SidebarContextMenu
        contextMenu={contextMenuManager.contextMenu}
        menuItems={contextMenuManager.getContextMenuItems()}
        onClose={contextMenuManager.closeContextMenu}
      />

      <SidebarModals
        solutionId={solutionId}
        teamId={sidebarState.teamId}
        modalState={modalState}
        onCloseDiagramModal={handleCloseDiagramModal}
        onCloseLinkUseCaseModal={handleCloseLinkUseCaseModal}
        onCreateDiagram={sidebarState.crudOperations.createDiagram}
        onLinkUseCase={handleLinkUseCase}
        getCurrentUseCaseId={getCurrentUseCaseId}
      />
    </div>
  );
}

/**
 * Shared type definitions for StudioSidebar components
 */

import type { ReactNode } from 'react';
import type { TreeNodeData, DropPosition, DropdownMenuItem } from '@/shared/ui';
import type { DesignWork, CreateDesignWorkDto } from '@/entities/design-work';
import type { DiagramType } from '@/entities/diagram';
import type { Interface, CreateInterfaceDto } from '@/entities/interface';
import type { Document, CreateDocumentDto } from '@/entities/document';
import type { Reference } from '@/entities/reference';
import type { DesignTab } from '@/app/model/stores/design-studio-ui';

// Union type for design content types
export type DesignContentType = 'diagram' | 'interface' | 'document';

// Re-export commonly used types
export type { TreeNodeData, DropPosition, DropdownMenuItem };

/** Props for the main StudioSidebar component */
export interface StudioSidebarProps {
  solutionId: string;
  useCaseId?: string; // For auto-linking new designworks
}

/** Context menu position and target state */
export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  nodeKey: string;
}

/** Inline editing state for folder rename */
export interface InlineEditState {
  editingFolderId: string | null;
  editingFolderName: string;
}

/** Modal states for sidebar dialogs */
export interface SidebarModalState {
  createDiagramModalOpen: boolean;
  selectedDesignWorkId: string | undefined;
  linkUseCaseModalOpen: boolean;
  linkUseCaseFolderId: string | undefined;
}

/** Parsed tree node key */
export interface ParsedNodeKey {
  type: 'folder' | 'diagram' | 'interface' | 'document' | 'reference';
  id: string;
}

/** Item representation for reordering */
export interface ReorderItem {
  id: string;
  type: string;
  order: number;
}

/** Reorder update payload */
export interface ReorderUpdate {
  id: string;
  itemType: 'folder' | 'diagram' | 'interface' | 'document';
  newOrder: number;
  newParentDesignWorkId?: string;
}

/** CRUD operations passed from useSidebarState */
export interface SidebarCRUDOperations {
  createDiagram: (data: { designWorkId: string; name: string; type: DiagramType }) => Promise<void>;
  createInterface: (data: CreateInterfaceDto) => Promise<Interface>;
  createDocument: (data: CreateDocumentDto) => Promise<Document>;
  deleteDiagram: (id: string) => Promise<void>;
  deleteInterface: (id: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  deleteDesignWork: (id: string) => Promise<void>;
  createDesignWork: (data: CreateDesignWorkDto) => Promise<DesignWork>;
  updateDesignWork: (id: string, updates: Partial<DesignWork>) => Promise<void>;
  reorderItems: (updates: ReorderUpdate[]) => Promise<void>;
}

/** Folder drop handlers for reference drops */
export interface FolderDropHandlers {
  canDropOnFolder: (dragData: Record<string, unknown>) => boolean;
  handleFolderDrop: (folderId: string, dragData: Record<string, unknown>) => Promise<void>;
}

/** Props for SidebarTree component */
export interface SidebarTreeProps {
  treeData: TreeNodeData[];
  defaultExpandedKeys: Set<string>;
  editingNodeKey: string | null;
  editingValue: string;
  onEditingChange: (newValue: string) => void;
  onEditingFinish: () => void;
  onDoubleClick: (key: string) => void;
  onContextMenu: (event: React.MouseEvent, key: string) => void;
  onDragOver: (event: React.DragEvent, key: string) => void;
  onDrop: (event: React.DragEvent, key: string) => void;
  onReorder: (draggedKey: string, targetKey: string, position: DropPosition) => void;
}

/** Props for SidebarContextMenu component */
export interface SidebarContextMenuProps {
  contextMenu: ContextMenuState | null;
  menuItems: DropdownMenuItem[];
  onClose: () => void;
}

/** Props for SidebarModals component */
export interface SidebarModalsProps {
  solutionId: string;
  teamId: string | undefined;
  modalState: SidebarModalState;
  onCloseDiagramModal: () => void;
  onCloseLinkUseCaseModal: () => void;
  onCreateDiagram: (data: { designWorkId: string; name: string; type: DiagramType }) => Promise<void>;
  onLinkUseCase: (designWorkId: string, useCaseId: string | undefined) => Promise<void>;
  getCurrentUseCaseId: (folderId: string | undefined) => string | undefined;
}

/** Return type for useSidebarState hook */
export interface UseSidebarStateReturn {
  teamId: string | undefined;
  designWorks: DesignWork[];
  references: Record<string, Reference>;
  crudOperations: SidebarCRUDOperations;
  folderDropHandlers: FolderDropHandlers;
  openTab: (tab: Omit<DesignTab, 'id'>) => void;
}

/** Props for useSidebarTree hook */
export interface UseSidebarTreeProps {
  designWorks: DesignWork[];
  references: Record<string, Reference>;
  solutionId: string;
}

/** Return type for useSidebarTree hook */
export interface UseSidebarTreeReturn {
  treeData: TreeNodeData[];
  defaultExpandedKeys: Set<string>;
  getContentIcon: (type: DesignContentType | 'reference') => ReactNode;
  getAllItemsAtLevel: (parentFolderId: string | undefined) => ReorderItem[];
}

/** Props for useSidebarDragDrop hook */
export interface UseSidebarDragDropProps {
  designWorks: DesignWork[];
  solutionId: string;
  reorderItems: (updates: ReorderUpdate[]) => Promise<void>;
  getAllItemsAtLevel: (parentFolderId: string | undefined) => ReorderItem[];
  folderDropHandlers: FolderDropHandlers;
}

/** Return type for useSidebarDragDrop hook */
export interface UseSidebarDragDropReturn {
  handleReorder: (draggedKey: string, targetKey: string, position: DropPosition) => Promise<void>;
  handleTreeDragOver: (event: React.DragEvent, nodeKey: string) => void;
  handleTreeDrop: (event: React.DragEvent, nodeKey: string) => Promise<void>;
}

/** Props for useSidebarContextMenu hook */
export interface UseSidebarContextMenuProps {
  designWorks: DesignWork[];
  crudOperations: SidebarCRUDOperations;
  onOpenDiagramModal: (folderId: string) => void;
  onOpenLinkUseCaseModal: (folderId: string) => void;
  onStartRename: (folderId: string, currentName: string) => void;
  onAddSubfolder: (parentFolderId: string) => Promise<void>;
}

/** Return type for useSidebarContextMenu hook */
export interface UseSidebarContextMenuReturn {
  contextMenu: ContextMenuState | null;
  handleContextMenu: (event: React.MouseEvent, nodeKey: string) => void;
  closeContextMenu: () => void;
  getContextMenuItems: () => DropdownMenuItem[];
}

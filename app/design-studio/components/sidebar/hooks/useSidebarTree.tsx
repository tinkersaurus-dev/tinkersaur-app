/**
 * useSidebarTree Hook
 * Handles tree data construction and memoization for the sidebar.
 */

import { useMemo, useCallback } from 'react';
import { MdFolder, MdDescription, MdAccountTree, MdDashboard, MdLink, MdLink as MdLinkIcon } from 'react-icons/md';
import type { ReactNode } from 'react';
import type { TreeNodeData } from '~/core/components';
import type { DesignContentType, DesignWork } from '~/core/entities/design-studio';
import type { UseSidebarTreeProps, UseSidebarTreeReturn, ReorderItem } from '../types';

export function useSidebarTree({
  designWorks,
  references,
  solutionId,
}: UseSidebarTreeProps): UseSidebarTreeReturn {
  // Helper to get icon based on content type
  const getContentIcon = useCallback((type: DesignContentType | 'reference'): ReactNode => {
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
  }, []);

  // Helper to get all items at a given level (child folders + content of parent folder)
  const getAllItemsAtLevel = useCallback(
    (parentFolderId: string | undefined): ReorderItem[] => {
      if (!parentFolderId) {
        // Root level: only folders
        return designWorks
          .filter((dw) => dw.solutionId === solutionId && !dw.parentDesignWorkId)
          .map((dw) => ({ id: dw.id, type: 'folder', order: dw.order }));
      }

      // Inside a folder: child folders + content items
      const parentFolder = designWorks.find((dw) => dw.id === parentFolderId);
      if (!parentFolder) return [];

      const childFolders = designWorks
        .filter((dw) => dw.parentDesignWorkId === parentFolderId)
        .map((dw) => ({ id: dw.id, type: 'folder', order: dw.order }));

      const diagrams = (parentFolder.diagrams || []).map((d) => ({ id: d.id, type: 'diagram', order: d.order }));
      const interfaces = (parentFolder.interfaces || []).map((i) => ({ id: i.id, type: 'interface', order: i.order }));
      const documents = (parentFolder.documents || []).map((d) => ({ id: d.id, type: 'document', order: d.order }));

      return [...childFolders, ...diagrams, ...interfaces, ...documents].sort((a, b) => a.order - b.order);
    },
    [designWorks, solutionId]
  );

  // Memoize tree data to avoid rebuilding on every render
  const treeData = useMemo(() => {
    // Helper to build a folder node with its children
    const buildFolderNode = (designWork: DesignWork): TreeNodeData => {
      // Get child folders
      const childFolders = designWorks.filter((dw) => dw.parentDesignWorkId === designWork.id);

      // Combine all items at this level: child folders + content items
      const allItems: Array<{ order: number; itemType: string; node: TreeNodeData }> = [
        // Child folders
        ...childFolders.map((childFolder) => ({
          order: childFolder.order,
          itemType: 'folder',
          node: buildFolderNode(childFolder),
        })),
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
            itemType: 'diagram',
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
          itemType: 'interface',
          node: {
            title: interfaceRef.name,
            key: `interface-${interfaceRef.id}`,
            icon: getContentIcon('interface'),
            isLeaf: true,
          },
        })),
        ...(designWork.documents || []).map((documentRef) => ({
          order: documentRef.order,
          itemType: 'document',
          node: {
            title: documentRef.name,
            key: `document-${documentRef.id}`,
            icon: getContentIcon('document'),
            isLeaf: true,
          },
        })),
      ];

      // Sort all items by order
      allItems.sort((a, b) => a.order - b.order);
      const children = allItems.map((item) => item.node);

      // Create folder icon, with link indicator if linked to a use case
      const folderIcon = designWork.useCaseId ? (
        <span className="flex items-center gap-0.5">
          <MdFolder />
          <MdLinkIcon className="text-xs text-[var(--text-secondary)]" />
        </span>
      ) : (
        <MdFolder />
      );

      return {
        title: designWork.name,
        key: `folder-${designWork.id}`,
        icon: folderIcon,
        children: children.length > 0 ? children : undefined,
      };
    };

    // Build tree recursively from DesignWorks (folders) using embedded metadata
    // Get root level folders (no parent), sorted by order
    const rootFolders = designWorks
      .filter((dw) => dw.solutionId === solutionId && !dw.parentDesignWorkId)
      .sort((a, b) => a.order - b.order);

    return rootFolders.map((folder) => buildFolderNode(folder));
  }, [designWorks, solutionId, references, getContentIcon]);

  // Compute folder keys to expand by default (not content items like diagrams with references)
  const defaultExpandedKeys = useMemo(() => {
    const keys = new Set<string>();
    designWorks
      .filter((dw) => dw.solutionId === solutionId)
      .forEach((dw) => keys.add(`folder-${dw.id}`));
    return keys;
  }, [designWorks, solutionId]);

  return {
    treeData,
    defaultExpandedKeys,
    getContentIcon,
    getAllItemsAtLevel,
  };
}

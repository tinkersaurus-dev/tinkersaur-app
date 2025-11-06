/**
 * StudioSidebar Component
 * Displays tree view of design content organized in folders (DesignWorks)
 * DesignWorks represent folders in the tree hierarchy
 */

import { useMemo } from 'react';
import { MdFolder, MdDescription, MdAccountTree, MdDashboard } from 'react-icons/md';
import { Tree } from '~/core/components';
import type { TreeNodeData } from '~/core/components';
import { useDesignStudioUIStore } from '../store';
import { useDesignStudioEntityStore, type DesignContentType } from '~/core/entities/design-studio';

interface StudioSidebarProps {
  solutionId: string;
}

export function StudioSidebar({ solutionId }: StudioSidebarProps) {
  // Use UI store for tab management only
  const { openTab } = useDesignStudioUIStore();

  // Get entity data from entity store
  const designWorks = useDesignStudioEntityStore((state) => state.designWorks);
  const diagrams = useDesignStudioEntityStore((state) => state.diagrams);
  const interfaces = useDesignStudioEntityStore((state) => state.interfaces);
  const documents = useDesignStudioEntityStore((state) => state.documents);

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

  // Build tree recursively from DesignWorks (folders)
  const buildTreeData = (parentDesignWorkId?: string): TreeNodeData[] => {
    const nodes: TreeNodeData[] = [];

    // Get child design works (folders) at this level
    const childDesignWorks = parentDesignWorkId
      ? designWorks.filter((dw) => dw.parentDesignWorkId === parentDesignWorkId)
      : designWorks.filter((dw) => dw.solutionId === solutionId && !dw.parentDesignWorkId);

    // Add each DesignWork as a folder
    childDesignWorks.forEach((designWork) => {
      // Get content for this design work
      const designWorkDiagrams = diagrams.filter((d) => d.designWorkId === designWork.id);
      const designWorkInterfaces = interfaces.filter((i) => i.designWorkId === designWork.id);
      const designWorkDocuments = documents.filter((d) => d.designWorkId === designWork.id);

      // Build children (nested folders and content)
      const children: TreeNodeData[] = [];

      // Add nested folders recursively
      const nestedFolders = buildTreeData(designWork.id);
      children.push(...nestedFolders);

      // Add diagrams
      designWorkDiagrams.forEach((diagram) => {
        children.push({
          title: diagram.name,
          key: `diagram-${diagram.id}`,
          icon: getContentIcon('diagram'),
          isLeaf: true,
        });
      });

      // Add interfaces
      designWorkInterfaces.forEach((iface) => {
        children.push({
          title: iface.name,
          key: `interface-${iface.id}`,
          icon: getContentIcon('interface'),
          isLeaf: true,
        });
      });

      // Add documents
      designWorkDocuments.forEach((doc) => {
        children.push({
          title: doc.name,
          key: `document-${doc.id}`,
          icon: getContentIcon('document'),
          isLeaf: true,
        });
      });

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
  const treeData = useMemo(() => buildTreeData(), [designWorks, diagrams, interfaces, documents, solutionId]);

  const handleDoubleClick = (key: string) => {
    // Parse key to get type and id
    const [type, id] = key.split('-');

    if (type === 'folder') return; // Don't open folders

    let contentType: DesignContentType;
    let title = '';

    switch (type) {
      case 'diagram': {
        contentType = 'diagram';
        const diagram = diagrams.find((d) => d.id === id);
        title = diagram?.name || 'Diagram';
        break;
      }
      case 'interface': {
        contentType = 'interface';
        const iface = interfaces.find((i) => i.id === id);
        title = iface?.name || 'Interface';
        break;
      }
      case 'document': {
        contentType = 'document';
        const doc = documents.find((d) => d.id === id);
        title = doc?.name || 'Document';
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

  return (
    <div className='bg-[var(--bg-dark)]' style={{ padding: '8px', height: '100%', overflow: 'auto' }}>
      <h3 className='text-[var(--text)]' style={{ marginBottom: '16px' }}>Product Name</h3>
      <Tree
        data={treeData}
        defaultExpandAll
        indentSize={8}
        onDoubleClick={handleDoubleClick}
      />
    </div>
  );
}

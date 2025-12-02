import { useEffect, useMemo, useState } from 'react';
import { useDesignWorkStore } from '~/core/entities/design-studio/store/design-work/useDesignWorkStore';
import { useDiagramStore, useDocumentStore } from '~/core/entities/design-studio';
import type { DesignWork } from '~/core/entities/design-studio';
import { useUseCaseStore } from '~/core/entities/product-management/store/useCase/useUseCaseStore';

interface ContentItem {
  type: 'diagram' | 'document';
  id: string;
  name: string;
  order: number;
}

/**
 * Recursively collect all descendant folder IDs including the given folder
 */
function getDescendantFolderIds(folderId: string, designWorks: DesignWork[]): string[] {
  const children = designWorks.filter((dw) => dw.parentDesignWorkId === folderId);
  return [folderId, ...children.flatMap((child) => getDescendantFolderIds(child.id, designWorks))];
}

/**
 * Hook to compile content from a folder and all its descendants
 * Returns markdown with headers for each diagram (mermaid) and document
 */
export function useFolderContent(folderId: string | undefined) {
  const designWorks = useDesignWorkStore((state) => state.designWorks);
  const diagrams = useDiagramStore((state) => state.diagrams);
  const diagramLoading = useDiagramStore((state) => state.loading);
  const fetchDiagram = useDiagramStore((state) => state.fetchDiagram);
  const documents = useDocumentStore((state) => state.documents);
  const documentLoading = useDocumentStore((state) => state.loading);
  const fetchDocument = useDocumentStore((state) => state.fetchDocument);
  const useCases = useUseCaseStore((state) => state.entities);

  const [error, setError] = useState<Error | null>(null);

  // Get all descendant folder IDs
  const folderIds = useMemo(() => {
    if (!folderId) return [];
    return getDescendantFolderIds(folderId, designWorks);
  }, [folderId, designWorks]);

  // Collect all content items from descendant folders
  const contentItems = useMemo(() => {
    const items: ContentItem[] = [];

    for (const id of folderIds) {
      const folder = designWorks.find((dw) => dw.id === id);
      if (!folder) continue;

      // Add diagrams
      for (const diagramRef of folder.diagrams || []) {
        items.push({
          type: 'diagram',
          id: diagramRef.id,
          name: diagramRef.name,
          order: diagramRef.order,
        });
      }

      // Add documents
      for (const documentRef of folder.documents || []) {
        items.push({
          type: 'document',
          id: documentRef.id,
          name: documentRef.name,
          order: documentRef.order,
        });
      }
    }

    // Sort by order
    items.sort((a, b) => a.order - b.order);

    return items;
  }, [folderIds, designWorks]);

  // Fetch all content items
  useEffect(() => {
    if (!folderId || contentItems.length === 0) {
      return;
    }

    let cancelled = false;

    const fetchAll = async () => {
      try {
        const promises: Promise<void>[] = [];

        for (const item of contentItems) {
          if (item.type === 'diagram' && !diagrams[item.id] && !diagramLoading[item.id]) {
            promises.push(fetchDiagram(item.id));
          } else if (item.type === 'document' && !documents[item.id] && !documentLoading[item.id]) {
            promises.push(fetchDocument(item.id));
          }
        }

        await Promise.all(promises);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch folder content'));
        }
      }
    };

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, [folderId, contentItems, diagrams, documents, diagramLoading, documentLoading, fetchDiagram, fetchDocument]);

  // Compile content into markdown
  const content = useMemo(() => {
    if (!folderId || folderIds.length === 0) {
      return '*No content in this folder*';
    }

    const sections: string[] = [];

    for (const id of folderIds) {
      const folder = designWorks.find((dw) => dw.id === id);
      if (!folder) continue;

      // Check if this folder has a linked use case
      if (folder.useCaseId) {
        const useCase = useCases.find((uc) => uc.id === folder.useCaseId);
        if (useCase) {
          let useCaseSection = `# Use Case: ${useCase.name}`;
          if (useCase.description) {
            useCaseSection += `\n\n${useCase.description}`;
          }
          useCaseSection += '\n\n---';
          sections.push(useCaseSection);
        }
      }

      // Get content items for this folder, sorted by order
      const folderItems = [
        ...(folder.diagrams || []).map((d) => ({ ...d, type: 'diagram' as const })),
        ...(folder.documents || []).map((d) => ({ ...d, type: 'document' as const })),
      ].sort((a, b) => a.order - b.order);

      // Add content for each item
      for (const item of folderItems) {
        if (item.type === 'diagram') {
          const diagram = diagrams[item.id];
          if (diagram) {
            const mermaidSyntax = diagram.mermaidSyntax || '*No diagram content*';
            sections.push(`## Diagram: ${item.name}\n\n\`\`\`mermaid\n${mermaidSyntax}\n\`\`\``);
          }
        } else if (item.type === 'document') {
          const document = documents[item.id];
          if (document) {
            const documentContent = document.content || '*No document content*';
            sections.push(`## Document: ${item.name}\n\n${documentContent}`);
          }
        }
      }
    }

    return sections.length > 0 ? sections.join('\n\n') : '*No content in this folder*';
  }, [folderId, folderIds, designWorks, useCases, diagrams, documents]);

  // Check if all content is loaded
  const allLoaded = useMemo(() => {
    for (const item of contentItems) {
      if (item.type === 'diagram' && !diagrams[item.id]) return false;
      if (item.type === 'document' && !documents[item.id]) return false;
    }
    return true;
  }, [contentItems, diagrams, documents]);

  return {
    content,
    loading: !allLoaded,
    error,
    itemCount: contentItems.length,
  };
}

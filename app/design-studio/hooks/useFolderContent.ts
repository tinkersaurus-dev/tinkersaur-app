import { useEffect, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useDesignWorkStore } from '~/core/entities/design-studio/store/design-work/useDesignWorkStore';
import { useDiagramStore, useDocumentStore } from '~/core/entities/design-studio';
import type { DesignWork } from '~/core/entities/design-studio';
import { useUseCaseQuery } from '~/product-management/queries';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { diagramApi, documentApi } from '~/core/entities/design-studio/api';

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
  const storedDiagrams = useDiagramStore((state) => state.diagrams);
  const setDiagram = useDiagramStore((state) => state.setDiagram);
  const storedDocuments = useDocumentStore((state) => state.documents);
  const setDocument = useDocumentStore((state) => state.setDocument);

  // Get the use case ID from the folder if it exists
  const folder = designWorks.find((dw) => dw.id === folderId);
  const useCaseId = folder?.useCaseId;

  // Use TanStack Query for use case data
  const { data: useCase } = useUseCaseQuery(useCaseId);

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

  // Create queries for diagrams
  const diagramQueries = useQueries({
    queries: contentItems
      .filter((item) => item.type === 'diagram')
      .map((item) => ({
        queryKey: queryKeys.diagrams.detail(item.id),
        queryFn: () => diagramApi.get(item.id),
        staleTime: STALE_TIMES.diagrams,
        enabled: !!folderId,
      })),
  });

  // Create queries for documents
  const documentQueries = useQueries({
    queries: contentItems
      .filter((item) => item.type === 'document')
      .map((item) => ({
        queryKey: queryKeys.documents.detail(item.id),
        queryFn: () => documentApi.get(item.id),
        staleTime: STALE_TIMES.documents,
        enabled: !!folderId,
      })),
  });

  // Sync fetched data to Zustand stores
  // Extract just the data arrays to use as stable dependencies
  const diagramData = diagramQueries.map((q) => q.data).filter(Boolean);
  const documentData = documentQueries.map((q) => q.data).filter(Boolean);

  useEffect(() => {
    diagramData.forEach((diagram) => {
      if (diagram) {
        setDiagram(diagram);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(diagramData.map((d) => d?.id)), setDiagram]);

  useEffect(() => {
    documentData.forEach((document) => {
      if (document) {
        setDocument(document);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(documentData.map((d) => d?.id)), setDocument]);

  // Combine diagrams from query results and store
  const diagrams = useMemo(() => {
    const result: Record<string, NonNullable<(typeof diagramQueries)[0]['data']>> = { ...storedDiagrams };
    diagramQueries.forEach((query) => {
      if (query.data) {
        result[query.data.id] = query.data;
      }
    });
    return result;
  }, [storedDiagrams, diagramQueries]);

  // Combine documents from query results and store
  const documents = useMemo(() => {
    const result: Record<string, NonNullable<(typeof documentQueries)[0]['data']>> = { ...storedDocuments };
    documentQueries.forEach((query) => {
      if (query.data) {
        result[query.data.id] = query.data;
      }
    });
    return result;
  }, [storedDocuments, documentQueries]);

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
      if (folder.useCaseId && useCase && useCase.id === folder.useCaseId) {
        let useCaseSection = `# Use Case: ${useCase.name}`;
        if (useCase.description) {
          useCaseSection += `\n\n${useCase.description}`;
        }
        useCaseSection += '\n\n---';
        sections.push(useCaseSection);
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
  }, [folderId, folderIds, designWorks, useCase, diagrams, documents]);

  // Check loading state
  const isLoading =
    diagramQueries.some((q) => q.isLoading) || documentQueries.some((q) => q.isLoading);

  // Check if all content is loaded
  const allLoaded = useMemo(() => {
    for (const item of contentItems) {
      if (item.type === 'diagram' && !diagrams[item.id]) return false;
      if (item.type === 'document' && !documents[item.id]) return false;
    }
    return true;
  }, [contentItems, diagrams, documents]);

  // Collect errors
  const error = useMemo(() => {
    const diagramError = diagramQueries.find((q) => q.error)?.error;
    const documentError = documentQueries.find((q) => q.error)?.error;
    if (diagramError) return diagramError instanceof Error ? diagramError : new Error('Failed to fetch diagram');
    if (documentError) return documentError instanceof Error ? documentError : new Error('Failed to fetch document');
    return null;
  }, [diagramQueries, documentQueries]);

  return {
    content,
    loading: isLoading || !allLoaded,
    error,
    itemCount: contentItems.length,
  };
}

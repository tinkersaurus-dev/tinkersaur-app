import { useEffect, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useDesignWorkStore } from '~/core/entities/design-studio/store/design-work/useDesignWorkStore';
import { useDiagramStore, useDocumentStore } from '~/core/entities/design-studio';
import type { DesignWork } from '~/core/entities/design-studio';
import { queryKeys } from '~/core/query/queryKeys';
import { STALE_TIMES } from '~/core/query/queryClient';
import { diagramApi, documentApi } from '~/core/entities/design-studio/api';

interface ContentItem {
  type: 'diagram' | 'document';
  id: string;
  name: string;
  order: number;
  folderId: string;
}

/**
 * Recursively collect all descendant folder IDs including the given folder
 * Child folders are sorted by their order property
 */
function getDescendantFolderIds(folderId: string, designWorks: DesignWork[]): string[] {
  const children = designWorks
    .filter((dw) => dw.parentDesignWorkId === folderId)
    .sort((a, b) => a.order - b.order);
  return [folderId, ...children.flatMap((child) => getDescendantFolderIds(child.id, designWorks))];
}

/**
 * Hook to compile content from ALL designworks linked to a use case
 * Returns markdown with headers for each folder, diagram (mermaid) and document
 *
 * Uses Zustand stores as the source of truth (shared with Design Studio's Definition tab)
 * to ensure real-time updates when content is modified.
 */
export function useUseCaseContent(solutionId: string | undefined, useCaseId: string | undefined) {
  // Read from Zustand stores (shared with Definition tab's Design Studio)
  const designWorks = useDesignWorkStore((state) => state.designWorks);
  const storedDiagrams = useDiagramStore((state) => state.diagrams);
  const setDiagram = useDiagramStore((state) => state.setDiagram);
  const storedDocuments = useDocumentStore((state) => state.documents);
  const setDocument = useDocumentStore((state) => state.setDocument);

  // Find all root folders (those directly linked to the use case)
  const rootFolders = useMemo(() => {
    return designWorks
      .filter((dw) => dw.useCaseId === useCaseId && !dw.parentDesignWorkId)
      .sort((a, b) => a.order - b.order);
  }, [designWorks, useCaseId]);

  // Get all folder IDs (roots + all descendants)
  const allFolderIds = useMemo(() => {
    const ids: string[] = [];
    for (const root of rootFolders) {
      ids.push(...getDescendantFolderIds(root.id, designWorks));
    }
    return ids;
  }, [rootFolders, designWorks]);

  // Collect all content items from all folders
  const contentItems = useMemo(() => {
    const items: ContentItem[] = [];

    for (const folderId of allFolderIds) {
      const folder = designWorks.find((dw) => dw.id === folderId);
      if (!folder) continue;

      // Add diagrams
      for (const diagramRef of folder.diagrams || []) {
        items.push({
          type: 'diagram',
          id: diagramRef.id,
          name: diagramRef.name,
          order: diagramRef.order,
          folderId,
        });
      }

      // Add documents
      for (const documentRef of folder.documents || []) {
        items.push({
          type: 'document',
          id: documentRef.id,
          name: documentRef.name,
          order: documentRef.order,
          folderId,
        });
      }
    }

    return items;
  }, [allFolderIds, designWorks]);

  // Create queries for diagrams (only fetch if not already in store)
  const diagramQueries = useQueries({
    queries: contentItems
      .filter((item) => item.type === 'diagram')
      .map((item) => ({
        queryKey: queryKeys.diagrams.detail(item.id),
        queryFn: () => diagramApi.get(item.id),
        staleTime: STALE_TIMES.diagrams,
        enabled: !!solutionId && !!useCaseId,
      })),
  });

  // Create queries for documents (only fetch if not already in store)
  const documentQueries = useQueries({
    queries: contentItems
      .filter((item) => item.type === 'document')
      .map((item) => ({
        queryKey: queryKeys.documents.detail(item.id),
        queryFn: () => documentApi.get(item.id),
        staleTime: STALE_TIMES.documents,
        enabled: !!solutionId && !!useCaseId,
      })),
  });

  // Sync fetched data to Zustand stores (matches useFolderContent pattern)
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

  // Combine diagrams from store and query results (store takes priority as source of truth)
  const diagrams = useMemo(() => {
    const result: Record<string, NonNullable<(typeof diagramQueries)[0]['data']>> = { ...storedDiagrams };
    diagramQueries.forEach((query) => {
      if (query.data) {
        result[query.data.id] = query.data;
      }
    });
    return result;
  }, [storedDiagrams, diagramQueries]);

  // Combine documents from store and query results (store takes priority as source of truth)
  const documents = useMemo(() => {
    const result: Record<string, NonNullable<(typeof documentQueries)[0]['data']>> = { ...storedDocuments };
    documentQueries.forEach((query) => {
      if (query.data) {
        result[query.data.id] = query.data;
      }
    });
    return result;
  }, [storedDocuments, documentQueries]);

  // Compile content into markdown with proper hierarchy
  const content = useMemo(() => {
    if (!solutionId || !useCaseId || rootFolders.length === 0) {
      return '*Define the use case to build a specification*';
    }

    const sections: string[] = [];

    // Helper to recursively render a folder and its contents
    const renderFolder = (currentFolderId: string, depth: number): void => {
      const folder = designWorks.find((dw) => dw.id === currentFolderId);
      if (!folder) return;

      // Add folder header
      const headerLevel = Math.min(depth + 2, 4); // Start at h2, cap at h4
      const headerPrefix = '#'.repeat(headerLevel);
      sections.push(`${headerPrefix} ${folder.name}`);

      // Get all items for this folder (diagrams, documents, and child folders), sorted by order
      const childFolders = designWorks.filter((dw) => dw.parentDesignWorkId === currentFolderId);
      const folderItems = [
        ...(folder.diagrams || []).map((d) => ({ ...d, type: 'diagram' as const })),
        ...(folder.documents || []).map((d) => ({ ...d, type: 'document' as const })),
        ...childFolders.map((cf) => ({ id: cf.id, name: cf.name, order: cf.order, type: 'folder' as const })),
      ].sort((a, b) => a.order - b.order);

      // Determine header level for content items
      const contentHeaderLevel = Math.min(depth + 3, 5); // Cap at h5
      const contentHeaderPrefix = '#'.repeat(contentHeaderLevel);

      // Render each item in order
      for (const item of folderItems) {
        if (item.type === 'diagram') {
          const diagram = diagrams[item.id];
          if (diagram) {
            const mermaidSyntax = diagram.mermaidSyntax || '*No diagram content*';
            sections.push(`${contentHeaderPrefix} Diagram: ${item.name}\n\n\`\`\`mermaid\n${mermaidSyntax}\n\`\`\``);
          }
        } else if (item.type === 'document') {
          const document = documents[item.id];
          if (document) {
            const documentContent = document.content || '*No document content*';
            sections.push(`${contentHeaderPrefix} Document: ${item.name}\n\n${documentContent}`);
          }
        } else if (item.type === 'folder') {
          renderFolder(item.id, depth + 1);
        }
      }
    };

    // Render each root folder
    for (const rootFolder of rootFolders) {
      renderFolder(rootFolder.id, 0);
    }

    return sections.length > 0 ? sections.join('\n\n') : '*No content in designworks*';
  }, [solutionId, useCaseId, rootFolders, designWorks, diagrams, documents]);

  // Check loading state
  const isLoading =
    diagramQueries.some((q) => q.isLoading) ||
    documentQueries.some((q) => q.isLoading);

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

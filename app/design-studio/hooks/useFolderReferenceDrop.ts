import { useCallback } from 'react';
import { useReferenceStore } from '~/core/entities/design-studio/store/reference/useReferenceStore';
import { useDesignWorkStore } from '~/core/entities/design-studio/store/design-work/useDesignWorkStore';
import { useDocumentStore } from '~/core/entities/design-studio/store/document/useDocumentStore';
import { useDiagramStore } from '~/core/entities/design-studio/store/diagram/useDiagramStore';
import { canShapeBeFolderReferenceSource } from '../config/reference-types';
import {
  generateClassMermaid,
  generateEnumerationMermaid,
} from '../diagrams/class/mermaid/single-entity-exporter';

/**
 * Hook for handling class/enumeration reference drops onto folders
 * Creates a document with mermaid syntax in a "References" subfolder
 */
export function useFolderReferenceDrop(solutionId: string | undefined) {
  const references = useReferenceStore((state) => state.references);
  const designWorks = useDesignWorkStore((state) => state.designWorks);
  const createDesignWork = useDesignWorkStore((state) => state.createDesignWork);
  const createDocument = useDocumentStore((state) => state.createDocument);
  const updateDocument = useDocumentStore((state) => state.updateDocument);
  const documents = useDocumentStore((state) => state.documents);
  const diagrams = useDiagramStore((state) => state.diagrams);

  /**
   * Find or create "References" subfolder under the target folder
   */
  const getOrCreateReferencesFolder = useCallback(
    async (parentFolderId: string): Promise<string> => {
      if (!solutionId) {
        throw new Error('Solution ID is required');
      }

      // Check for existing "References" subfolder
      const existingReferences = designWorks.find(
        (dw) => dw.parentDesignWorkId === parentFolderId && dw.name === 'References'
      );

      if (existingReferences) {
        return existingReferences.id;
      }

      // Create new "References" subfolder
      const newFolder = await createDesignWork({
        solutionId,
        parentDesignWorkId: parentFolderId,
        name: 'References',
        version: '1.0.0',
        diagrams: [],
        interfaces: [],
        documents: [],
        references: [],
      });

      return newFolder.id;
    },
    [solutionId, designWorks, createDesignWork]
  );

  /**
   * Check if drag data represents a folder-droppable reference
   */
  const canDropOnFolder = useCallback(
    (dragData: Record<string, unknown>): boolean => {
      if (dragData.type !== 'reference') return false;

      const referenceId = dragData.referenceId as string;
      const reference = references[referenceId];
      if (!reference?.metadata) return false;

      // Check if this is a folder reference type (class/enumeration)
      return canShapeBeFolderReferenceSource(
        reference.metadata.sourceShapeType,
        reference.metadata.sourceShapeSubtype
      );
    },
    [references]
  );

  /**
   * Handle drop onto a folder node
   */
  const handleFolderDrop = useCallback(
    async (folderId: string, dragData: Record<string, unknown>) => {
      if (!solutionId) {
        console.error('Solution ID is required for folder drop');
        return;
      }

      if (dragData.type !== 'reference') return;

      const referenceId = dragData.referenceId as string;
      const reference = references[referenceId];
      if (!reference?.metadata) {
        console.error('Reference not found or missing metadata');
        return;
      }

      // Get source diagram and shape
      const sourceDiagram = diagrams[reference.contentId];
      if (!sourceDiagram) {
        console.error('Source diagram not found');
        return;
      }

      const sourceShape = sourceDiagram.shapes.find(
        (s) => s.id === reference.sourceShapeId
      );
      if (!sourceShape) {
        console.error('Source shape not found');
        return;
      }

      // Verify this is a folder reference type
      if (
        !canShapeBeFolderReferenceSource(
          reference.metadata.sourceShapeType,
          reference.metadata.sourceShapeSubtype
        )
      ) {
        console.error('Reference is not a folder reference type');
        return;
      }

      try {
        // Get or create "References" subfolder
        const referencesFolderId = await getOrCreateReferencesFolder(folderId);

        // Generate document name and content
        const isEnumeration = reference.metadata.sourceShapeType === 'enumeration';
        const prefix = isEnumeration ? '["Enumeration"]' : '["Class"]';
        const documentName = `${prefix} ${sourceShape.label || (isEnumeration ? 'Enumeration' : 'Class')}`;
        const mermaidContent = isEnumeration
          ? generateEnumerationMermaid(sourceShape)
          : generateClassMermaid(sourceShape);

        // Check if document already exists in References folder
        const referencesFolder = designWorks.find((dw) => dw.id === referencesFolderId);
        const existingDocRef = referencesFolder?.documents.find((d) => d.name === documentName);

        if (existingDocRef) {
          // Document exists - update its content
          // First, make sure we have the document loaded
          const existingDoc = documents[existingDocRef.id];
          if (existingDoc) {
            await updateDocument(existingDocRef.id, { content: mermaidContent });
          } else {
            // Document not loaded yet - fetch and update
            await updateDocument(existingDocRef.id, { content: mermaidContent });
          }
          console.warn(`Updated existing document: ${documentName}`);
        } else {
          // Create new document
          await createDocument({
            designWorkId: referencesFolderId,
            name: documentName,
            content: mermaidContent,
          });
          console.warn(`Created new document: ${documentName}`);
        }
      } catch (error) {
        console.error('Failed to handle folder drop:', error);
        throw error;
      }
    },
    [
      solutionId,
      references,
      diagrams,
      designWorks,
      documents,
      getOrCreateReferencesFolder,
      createDocument,
      updateDocument,
    ]
  );

  return {
    canDropOnFolder,
    handleFolderDrop,
  };
}

import { useCallback } from 'react';
import { useReferenceStore } from '@/entities/reference/store/useReferenceStore';
import { useDesignWorkStore } from '@/entities/design-work/store/useDesignWorkStore';
import { useDocumentStore } from '@/entities/document/store/useDocumentStore';
import { diagramApi } from '@/entities/diagram';
import { canShapeBeFolderReferenceSource } from '@/entities/reference';
import {
  generateClassMermaid,
  generateEnumerationMermaid,
} from '@/features/diagram-rendering/class/mermaid/single-entity-exporter';

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
        requirementRefs: [],
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

      // Fetch the source shape via API
      const sourceShape = await diagramApi.getShape(reference.contentId, reference.sourceShapeId);
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
          const existingDoc = documents[existingDocRef.id];
          if (existingDoc) {
            await updateDocument(existingDocRef.id, { content: mermaidContent });
          } else {
            await updateDocument(existingDocRef.id, { content: mermaidContent });
          }
        } else {
          // Create new document
          await createDocument({
            designWorkId: referencesFolderId,
            name: documentName,
            content: mermaidContent,
          });
        }
      } catch (error) {
        console.error('Failed to handle folder drop:', error);
        throw error;
      }
    },
    [
      solutionId,
      references,
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

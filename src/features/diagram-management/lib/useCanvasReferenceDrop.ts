import { useCallback } from 'react';
import { useDiagram, useDiagramCRUD } from '@/features/diagram-management';
import { useReferenceStore } from '@/entities/reference/store/useReferenceStore';
import { getReferenceConfigForShape, canReferenceBeDroppedInContent } from '@/shared/config/reference-types';
import { useDiagramStore } from '@/entities/diagram/store/useDiagramStore';

/**
 * Hook for handling reference drops onto the canvas
 * Validates drop, creates target shape based on reference config
 */
export function useCanvasReferenceDrop(
  diagramId: string | undefined,
  viewportZoom: number,
  viewportPanX: number,
  viewportPanY: number
) {
  const { diagram } = useDiagram(diagramId);
  const { addShape } = useDiagramCRUD(diagramId);
  const references = useReferenceStore((state) => state.references);

  /**
   * Convert screen coordinates to canvas coordinates
   */
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number, containerRect: DOMRect) => {
      const canvasX = (screenX - containerRect.left - viewportPanX) / viewportZoom;
      const canvasY = (screenY - containerRect.top - viewportPanY) / viewportZoom;
      return { canvasX, canvasY };
    },
    [viewportZoom, viewportPanX, viewportPanY]
  );

  /**
   * Handle dragover event - determines if drop is allowed
   */
  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      // Check if drag data contains reference type
      const types = event.dataTransfer.types;
      if (types.includes('application/json')) {
        event.preventDefault(); // Allow drop
        event.dataTransfer.dropEffect = 'copy';
      }
    },
    []
  );

  /**
   * Handle drop event - creates shape from reference
   */
  const handleDrop = useCallback(
    async (event: React.DragEvent, containerRef: HTMLDivElement | null) => {
      event.preventDefault();

      if (!diagramId || !diagram || !addShape || !containerRef) {
        return;
      }

      try {
        // Parse drag data
        const jsonData = event.dataTransfer.getData('application/json');
        if (!jsonData) return;

        const dragData = JSON.parse(jsonData);

        // Verify this is a reference drop
        if (dragData.type !== 'reference') return;

        // Get full reference from store
        const reference = references[dragData.referenceId];
        if (!reference || !reference.metadata) {
          console.error('Reference not found or missing metadata');
          return;
        }

        // Get reference config for this source shape
        const referenceConfig = getReferenceConfigForShape(
          reference.metadata.sourceShapeType,
          reference.metadata.sourceShapeSubtype
        );

        if (!referenceConfig) {
          console.error('No reference config found for shape type');
          return;
        }

        // Ensure diagram is loaded
        if (!diagram) {
          console.error('Diagram not loaded');
          return;
        }

        // Validate drop is allowed in this diagram type
        if (!canReferenceBeDroppedInContent(referenceConfig, 'diagram', diagram.type)) {
          console.warn(
            `Reference cannot be dropped in ${diagram.type} diagram. Supported types: ${referenceConfig.supportedDiagramTypes?.join(', ')}`
          );
          return;
        }

        // Convert screen coordinates to canvas coordinates
        const containerRect = containerRef.getBoundingClientRect();
        const { canvasX, canvasY } = screenToCanvas(
          event.clientX,
          event.clientY,
          containerRect
        );

        // Get the source diagram name for the label
        const diagrams = useDiagramStore.getState().diagrams;
        const sourceDiagram = diagrams[reference.contentId];
        const sourceDiagramName = sourceDiagram?.name || 'Unknown';

        // Create label in format "Reference_Text From Diagram_Name"
        const label = `${reference.name} from ${sourceDiagramName}`;

        // Create target shape using reference config
        const targetShape = referenceConfig.createTargetShape(
          label,
          canvasX,
          canvasY
        );

        // Add shape to diagram
        await addShape(targetShape);
      } catch (error) {
        console.error('Failed to handle reference drop:', error);
      }
    },
    [diagramId, diagram, addShape, references, screenToCanvas]
  );

  return {
    handleDragOver,
    handleDrop,
  };
}

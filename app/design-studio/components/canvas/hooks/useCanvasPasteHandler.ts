import { useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { DiagramType } from '~/core/entities/design-studio/types/Diagram';
import type { CommandFactory } from '~/core/commands/CommandFactory';
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Connector } from '~/core/entities/design-studio/types/Connector';
import { getMermaidImporter } from '~/design-studio/lib/mermaid';
import { commandManager } from '~/core/commands/CommandManager';
import { toast } from '~/core/utils/toast';

interface UseCanvasPasteHandlerProps {
  diagramId: string;
  diagramType: DiagramType;
  commandFactory: CommandFactory;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  getMousePosition: () => { x: number; y: number };
  enabled: boolean;
}

/**
 * Hook to handle paste events on the canvas for importing Mermaid diagrams
 * Listens for paste events and attempts to parse and import Mermaid syntax
 */
export function useCanvasPasteHandler({
  diagramId,
  diagramType,
  commandFactory,
  canvasRef,
  getMousePosition,
  enabled,
}: UseCanvasPasteHandlerProps) {
  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      if (!enabled) {
        return;
      }

      // Get clipboard text
      const clipboardText = event.clipboardData?.getData('text/plain');

      if (!clipboardText || clipboardText.trim().length === 0) {
        return;
      }

      const trimmedText = clipboardText.trim();

      // Check if it looks like Mermaid syntax (starts with diagram type)
      if (
        !trimmedText.startsWith('flowchart') &&
        !trimmedText.startsWith('graph') &&
        !trimmedText.startsWith('classDiagram') &&
        !trimmedText.startsWith('sequenceDiagram')
      ) {
        // Not Mermaid syntax, ignore
        return;
      }

      // Prevent default paste behavior since we're handling it
      event.preventDefault();

      try {
        // Get the importer for this diagram type
        const importerResult = getMermaidImporter(diagramType);
        if (!importerResult.ok) {
          toast.error(importerResult.error);
          return;
        }

        const importer = importerResult.value;

        // Validate the syntax matches the current diagram type
        const validationResult = importer.validate(trimmedText);
        if (!validationResult.ok) {
          toast.info(validationResult.error);
          return;
        }

        // Get current mouse position (or center of viewport)
        const centerPoint = getMousePosition();

        // Import the Mermaid syntax
        const importResult = importer.import(trimmedText, { centerPoint });
        if (!importResult.ok) {
          toast.error(importResult.error);
          return;
        }

        const { shapes: shapeDTOs, connectors: connectorRefs } = importResult.value;

        if (shapeDTOs.length === 0) {
          toast.info('No shapes to import');
          return;
        }

        // Generate IDs for all shapes and build a mapping from indices to IDs
        const shapeIdMapping = new Map<number, string>();
        const shapesWithIds: Shape[] = shapeDTOs.map((shapeDTO, index) => {
          const id = uuidv4();
          shapeIdMapping.set(index, id);
          return {
            id,
            ...shapeDTO,
          };
        });

        // Convert connector refs (using shape indices) to connectors (using shape IDs)
        const connectorsWithIds: Connector[] = connectorRefs.map((connectorRef) => {
          const sourceShapeId = shapeIdMapping.get(connectorRef.fromShapeIndex);
          const targetShapeId = shapeIdMapping.get(connectorRef.toShapeIndex);

          if (!sourceShapeId || !targetShapeId) {
            throw new Error('Invalid connector reference - shape ID not found');
          }

          const { fromShapeIndex: _fromShapeIndex, toShapeIndex: _toShapeIndex, ...connectorData } = connectorRef;
          return {
            id: uuidv4(),
            sourceShapeId,
            targetShapeId,
            ...connectorData,
          };
        });

        // Create and execute import command
        const command = commandFactory.createImportMermaid(diagramId, shapesWithIds, connectorsWithIds);
        await commandManager.execute(command, diagramId);

        // Show success message
        toast.success(
          `Imported ${shapesWithIds.length} shape${shapesWithIds.length !== 1 ? 's' : ''} and ${connectorsWithIds.length} connector${connectorsWithIds.length !== 1 ? 's' : ''}`
        );
      } catch (error) {
        console.error('Failed to import Mermaid diagram:', error);
        toast.error(
          `Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    },
    [enabled, diagramId, diagramType, commandFactory, getMousePosition]
  );

  useEffect(() => {
    const canvasElement = canvasRef.current;

    if (!canvasElement || !enabled) {
      return;
    }

    // Listen for paste events on the document level
    // We check if the canvas is focused to determine if we should handle the paste
    const listener = (event: Event) => {
      // Only handle paste if canvas is focused or if no input element is focused
      const activeElement = document.activeElement;
      const isCanvasFocused = activeElement === canvasElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.hasAttribute('contenteditable');

      // Only handle paste when canvas is focused or no input is focused
      if (isCanvasFocused || !isInputFocused) {
        handlePaste(event as ClipboardEvent);
      }
    };

    document.addEventListener('paste', listener);

    return () => {
      document.removeEventListener('paste', listener);
    };
  }, [canvasRef, enabled, handlePaste]);

  return {
    handlePaste,
  };
}

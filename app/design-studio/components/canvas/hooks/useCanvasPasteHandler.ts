import { useEffect, useCallback } from 'react';
import type { DiagramType } from '~/core/entities/design-studio/types/Diagram';
import type { CommandFactory } from '~/core/commands/CommandFactory';
import { commandManager } from '~/core/commands/CommandManager';
import { toast } from '~/core/utils/toast';
import { CreatePreviewFromPasteCommand } from '~/core/commands/canvas/preview-import/CreatePreviewFromPasteCommand';
import { useDesignStudioEntityStore } from '~/core/entities/design-studio/store';

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
  canvasRef,
  getMousePosition,
  enabled,
}: UseCanvasPasteHandlerProps) {
  // Get entity store functions for creating the preview command
  const addShape = useDesignStudioEntityStore((state) => state._internalAddShape);
  const addConnector = useDesignStudioEntityStore((state) => state._internalAddConnector);
  const deleteShape = useDesignStudioEntityStore((state) => state._internalDeleteShape);
  const deleteConnector = useDesignStudioEntityStore((state) => state._internalDeleteConnector);
  const addShapesBatch = useDesignStudioEntityStore((state) => state._internalAddShapesBatch);
  const addConnectorsBatch = useDesignStudioEntityStore((state) => state._internalAddConnectorsBatch);

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
        // Get current mouse position (or center of viewport)
        const pastePosition = getMousePosition();

        // Create preview from pasted mermaid syntax
        const command = new CreatePreviewFromPasteCommand(
          diagramId,
          diagramType,
          trimmedText,
          pastePosition,
          addShape,
          addConnector,
          deleteShape,
          deleteConnector,
          addShapesBatch,
          addConnectorsBatch
        );

        await commandManager.execute(command, diagramId);

        // Show success message
        toast.success('Mermaid diagram pasted. Review and click "Apply" to add to canvas.');
      } catch (error) {
        console.error('Failed to create preview from pasted Mermaid:', error);
        toast.error(
          `Failed to paste diagram: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    },
    [enabled, diagramId, diagramType, getMousePosition, addShape, addConnector, deleteShape, deleteConnector, addShapesBatch, addConnectorsBatch]
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

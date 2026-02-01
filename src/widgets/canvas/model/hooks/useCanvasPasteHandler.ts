import { useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { DiagramType } from '@/entities/diagram';
import type { CommandFactory } from '@/features/canvas-commands/model/CommandFactory';
import { commandManager } from '@/features/canvas-commands/model/CommandManager';
import { toast } from '@/shared/lib/utils';
import { CreatePreviewFromPasteCommand } from '@/features/canvas-commands/commands/preview-import/CreatePreviewFromPasteCommand';
import { useDiagramStore } from '@/entities/diagram/store/useDiagramStore';

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
  // Get entity store functions for creating the preview command (bundled for cleaner dependency array)
  const storeOps = useDiagramStore(
    useShallow((state) => ({
      addShape: state._internalAddShape,
      addConnector: state._internalAddConnector,
      deleteShape: state._internalDeleteShape,
      deleteConnector: state._internalDeleteConnector,
      addShapesBatch: state._internalAddShapesBatch,
      addConnectorsBatch: state._internalAddConnectorsBatch,
      updateShape: state._internalUpdateShape,
    }))
  );

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
        !trimmedText.startsWith('sequenceDiagram') &&
        !trimmedText.startsWith('architecture-beta') &&
        !trimmedText.startsWith('erDiagram')
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
          storeOps.addShape,
          storeOps.addConnector,
          storeOps.deleteShape,
          storeOps.deleteConnector,
          storeOps.addShapesBatch,
          storeOps.addConnectorsBatch,
          storeOps.updateShape
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
    [enabled, diagramId, diagramType, getMousePosition, storeOps]
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

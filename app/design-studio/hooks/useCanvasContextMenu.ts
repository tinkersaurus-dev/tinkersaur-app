import type { RefObject } from 'react';
import { screenToCanvas } from '../utils/canvas';
import type { CreateShapeDTO } from '~/core/entities/design-studio';

// Extend HTMLDivElement to include custom properties for context menu
interface CanvasContainerElement extends HTMLDivElement {
  _contextClickPos?: { canvasX: number; canvasY: number };
}

interface UseCanvasContextMenuProps {
  containerRef: RefObject<HTMLDivElement | null>;
  zoom: number;
  panX: number;
  panY: number;
  openContextMenu: (screenX: number, screenY: number) => void;
  addShape: (shape: CreateShapeDTO) => Promise<void>;
  setContextMenuCanvasPos: (pos: { canvasX: number; canvasY: number } | null) => void;
}

interface UseCanvasContextMenuReturn {
  handleContextMenu: (event: React.MouseEvent) => void;
  handleAddRectangle: () => Promise<void>;
}

/**
 * Hook for managing context menu interactions
 */
export function useCanvasContextMenu({
  containerRef,
  zoom,
  panX,
  panY,
  openContextMenu,
  addShape,
  setContextMenuCanvasPos,
}: UseCanvasContextMenuProps): UseCanvasContextMenuReturn {
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();

    const container = containerRef.current;
    if (!container) return;

    // Get click position in screen coordinates
    const rect = container.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    // Open context menu at screen position
    openContextMenu(event.clientX, event.clientY);

    // Store canvas position for shape creation (both in state and DOM for backward compatibility)
    const { x: canvasX, y: canvasY } = screenToCanvas(screenX, screenY, zoom, panX, panY);
    setContextMenuCanvasPos({ canvasX, canvasY });
    (event.currentTarget as CanvasContainerElement)._contextClickPos = { canvasX, canvasY };
  };

  const handleAddRectangle = async () => {
    const container = containerRef.current as CanvasContainerElement | null;
    if (!container) return;

    // Get stored canvas position from last right-click
    const storedPos = container._contextClickPos;
    if (!storedPos) return;

    const { canvasX, canvasY } = storedPos;

    // Persist to entity store (will trigger command and re-initialize local state)
    await addShape({
      type: 'rectangle',
      x: canvasX,
      y: canvasY,
      width: 120,
      height: 80,
      zIndex: 0,
      locked: false,
    });

    // Clean up stored position
    delete container._contextClickPos;
  };

  return {
    handleContextMenu,
    handleAddRectangle,
  };
}

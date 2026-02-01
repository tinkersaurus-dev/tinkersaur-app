import { useCallback, type RefObject } from 'react';
import type { ViewportTransform } from '../utils/viewport';
import type { DiagramType } from '@/entities/diagram';
import { MENU_IDS } from './useContextMenuManager';

interface OpenMenuParams {
  id: string;
  screenPosition: { x: number; y: number };
  canvasPosition: { x: number; y: number };
}

interface UseCanvasContextMenuProps {
  // Refs
  containerRef: RefObject<HTMLDivElement | null>;

  // Viewport for coordinate transformation
  viewportTransform: ViewportTransform;

  // Diagram type for menu routing
  diagramType: DiagramType | undefined;

  // Menu manager open function
  openMenu: (params: OpenMenuParams) => void;
}

interface UseCanvasContextMenuReturn {
  handleContextMenu: (e: React.MouseEvent) => void;
}

/**
 * Hook for managing canvas right-click context menu
 *
 * Handles:
 * - Coordinate transformation from screen to canvas
 * - Diagram-type-specific menu routing (BPMN, class, sequence, architecture, entity-relationship)
 * - Fallback to generic canvas context menu
 *
 * @param props - Configuration for context menu handling
 * @returns Context menu event handler
 */
export function useCanvasContextMenu({
  containerRef,
  viewportTransform,
  diagramType,
  openMenu,
}: UseCanvasContextMenuProps): UseCanvasContextMenuReturn {

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();

    const container = containerRef.current;
    if (!container) return;

    // Get click position in screen coordinates
    const rect = container.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    // Convert to canvas coordinates for shape placement
    const { x: canvasX, y: canvasY } = viewportTransform.screenToCanvas(screenX, screenY);

    // Determine which menu to open based on diagram type
    let menuId: string = MENU_IDS.CANVAS_CONTEXT_MENU;
    if (diagramType === 'bpmn') {
      menuId = MENU_IDS.BPMN_TOOLSET_POPOVER;
    } else if (diagramType === 'class') {
      menuId = MENU_IDS.CLASS_TOOLSET_POPOVER;
    } else if (diagramType === 'sequence') {
      menuId = MENU_IDS.SEQUENCE_TOOLSET_POPOVER;
    } else if (diagramType === 'architecture') {
      menuId = MENU_IDS.ARCHITECTURE_TOOLSET_POPOVER;
    } else if (diagramType === 'entity-relationship') {
      menuId = MENU_IDS.ENTITY_RELATIONSHIP_TOOLSET_POPOVER;
    }

    // Open the appropriate menu
    openMenu({
      id: menuId,
      screenPosition: { x: event.clientX, y: event.clientY },
      canvasPosition: { x: canvasX, y: canvasY },
    });
  }, [containerRef, viewportTransform, diagramType, openMenu]);

  return {
    handleContextMenu,
  };
}

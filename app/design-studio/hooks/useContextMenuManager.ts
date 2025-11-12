import { useState, useCallback, type RefObject } from 'react';

/**
 * Configuration for a menu instance
 */
export interface MenuConfig<T = Record<string, string | number | boolean>> {
  id: string;
  screenPosition: { x: number; y: number };
  canvasPosition?: { x: number; y: number };
  metadata?: T;
}

/**
 * Menu IDs for all menus managed by this hook
 */
export const MENU_IDS = {
  CANVAS_CONTEXT_MENU: 'canvas-context-menu',
  BPMN_TOOLSET_POPOVER: 'bpmn-toolset-popover',
  CLASS_TOOLSET_POPOVER: 'class-toolset-popover',
  CONNECTOR_TOOLBAR_POPOVER: 'connector-toolbar-popover',
  CONNECTOR_CONTEXT_MENU: 'connector-context-menu',
} as const;

/**
 * Return type for the useContextMenuManager hook
 */
export interface UseContextMenuManagerReturn {
  // State
  activeMenuId: string | null;
  activeMenuConfig: MenuConfig | null;

  // Core actions
  openMenu: <T = Record<string, string | number | boolean>>(config: MenuConfig<T>) => void;
  closeMenu: (menuId?: string) => void;
  closeAllMenus: () => void;

  // Helpers
  isMenuOpen: (menuId: string) => boolean;
  getMenuConfig: (menuId: string) => MenuConfig | null;

  // Specialized openers
  openCanvasContextMenu: (screenX: number, screenY: number, canvasX: number, canvasY: number) => void;
  openConnectorToolbarPopover: (buttonRef?: RefObject<HTMLElement>) => void;
  openConnectorContextMenu: (connectorId: string, screenX: number, screenY: number) => void;
}

/**
 * Unified hook for managing all context menus and popovers in the canvas.
 *
 * This hook consolidates menu state management across:
 * - Canvas context menu (simple rectangle menu)
 * - BPMN toolset popover
 * - Class toolset popover
 * - Connector toolbar popover
 * - Connector context menu
 *
 * Features:
 * - Only one menu can be open at a time (exclusive)
 * - Supports both screen and canvas coordinates
 * - Type-safe metadata for menu-specific context
 * - Centralized state management
 */
export function useContextMenuManager(): UseContextMenuManagerReturn {
  const [activeMenuConfig, setActiveMenuConfig] = useState<MenuConfig | null>(null);

  const openMenu = useCallback(<T = Record<string, string | number | boolean>>(config: MenuConfig<T>) => {
    setActiveMenuConfig(config as MenuConfig);
  }, []);

  const closeMenu = useCallback((menuId?: string) => {
    if (menuId) {
      // Close specific menu only if it's the active one
      setActiveMenuConfig((current) => (current?.id === menuId ? null : current));
    } else {
      // Close the active menu
      setActiveMenuConfig(null);
    }
  }, []);

  const closeAllMenus = useCallback(() => {
    setActiveMenuConfig(null);
  }, []);

  const isMenuOpen = useCallback(
    (menuId: string) => {
      return activeMenuConfig?.id === menuId;
    },
    [activeMenuConfig]
  );

  const getMenuConfig = useCallback(
    (menuId: string) => {
      return activeMenuConfig?.id === menuId ? activeMenuConfig : null;
    },
    [activeMenuConfig]
  );

  // Specialized opener for canvas context menu (BPMN/Class toolset or simple menu)
  const openCanvasContextMenu = useCallback(
    (screenX: number, screenY: number, canvasX: number, canvasY: number) => {
      // Note: The specific menu ID (canvas/bpmn/class) will be determined by the Canvas component
      // based on diagram type. This just stores the common data.
      openMenu({
        id: MENU_IDS.CANVAS_CONTEXT_MENU, // Default, will be overridden
        screenPosition: { x: screenX, y: screenY },
        canvasPosition: { x: canvasX, y: canvasY },
      });
    },
    [openMenu]
  );

  // Specialized opener for connector toolbar popover
  const openConnectorToolbarPopover = useCallback(
    (buttonRef?: RefObject<HTMLElement>) => {
      let x = window.innerWidth / 2 - 100;
      let y = window.innerHeight - 100;

      // If button ref is provided, position relative to button
      if (buttonRef?.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        x = rect.left + rect.width / 2 - 100;
        y = rect.bottom + 10;
      }

      openMenu({
        id: MENU_IDS.CONNECTOR_TOOLBAR_POPOVER,
        screenPosition: { x, y },
      });
    },
    [openMenu]
  );

  // Specialized opener for connector context menu
  const openConnectorContextMenu = useCallback(
    (connectorId: string, screenX: number, screenY: number) => {
      openMenu({
        id: MENU_IDS.CONNECTOR_CONTEXT_MENU,
        screenPosition: { x: screenX, y: screenY },
        metadata: { connectorId },
      });
    },
    [openMenu]
  );

  return {
    activeMenuId: activeMenuConfig?.id ?? null,
    activeMenuConfig,
    openMenu,
    closeMenu,
    closeAllMenus,
    isMenuOpen,
    getMenuConfig,
    openCanvasContextMenu,
    openConnectorToolbarPopover,
    openConnectorContextMenu,
  };
}

/**
 * SidebarContextMenu Component
 * Renders the Dropdown context menu for the sidebar tree.
 */

import { Dropdown } from '@/shared/ui';
import type { SidebarContextMenuProps } from '../model/types';

export function SidebarContextMenu({
  contextMenu,
  menuItems,
  onClose,
}: SidebarContextMenuProps) {
  if (!contextMenu) return null;

  return (
    <Dropdown
      trigger="contextMenu"
      isOpen={contextMenu.isOpen}
      onClose={onClose}
      position={{ x: contextMenu.x, y: contextMenu.y }}
      menu={{ items: menuItems }}
    />
  );
}
